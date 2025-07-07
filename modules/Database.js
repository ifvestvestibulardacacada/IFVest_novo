const { Usuario } = require('../models');
const { Questao } = require('../models');
const { Opcao } = require('../models');
const { Simulado } = require('../models');
const { Resposta } = require('../models');
const { Topico } = require('../models');
const { removeFileFromUploads } = require('../utils/removeImage')
const { atualizarRelacaoTopicos } = require('../utils/AreaTopicoUtil')
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');


class Database {
    static questoes = {
        delete: async (req, res) => {
            try {
                const { id } = req.params;
                const questao = await Questao.findByPk(id);

                if (!questao) {
                    throw new Error("Questão nao encontrada");
                }

                await Opcao.destroy({
                    where: { id_questao: questao.id_questao }
                });

                await questao.destroy();

                res.status(200).redirect('/professor/questoes')
            } catch (error) {
                console.error(error);
                req.session.errorMessage = error.message;
                await new Promise((resolve, reject) => {
                    req.session.save(err => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                return res.redirect(req.session.lastGetUrl || '/');
            }
        },
        register: async (req, res) => {
            const {
                titulo,
                pergunta,
                areaId,
                correta,
                topicosSelecionados,
                respostasSelecionadas
            } = req.body;

            const tipo = req.params.tipo.toUpperCase()

            let arrayRespostas;

            const MIN_OPCOES = 1;
            const MAX_OPCOES = 5;

            const id_usuario = req.session.userId;

            const alternativas = ['A', 'B', 'C', 'D', 'E'];

            try {
                if (!pergunta) {
                    throw new Error("Pergunta não pode ser vazio")
                }
                if (!respostasSelecionadas) {
                    throw new Error("Respostas não pode ser vazio")
                }
                if (!topicosSelecionados) {
                    throw new Error("Selecione pelo menos um topico");
                }

                try {
                    arrayRespostas = JSON.parse(respostasSelecionadas);
                    if (typeof arrayRespostas !== 'object' || arrayRespostas === null) {
                        throw new Error("Formato de respostas inválido");
                    }
                } catch (parseError) {
                    throw new Error("Erro ao processar respostas: formato JSON inválido");
                }

                const numOpcoes = Object.keys(arrayRespostas).length;
                if (numOpcoes < MIN_OPCOES || numOpcoes > MAX_OPCOES) {
                    throw new Error(`Número de opções deve ser entre ${MIN_OPCOES} e ${MAX_OPCOES}`);
                }

    
          

                if ((tipo === 'DISSERTATIVA' && numOpcoes !== 1) ||
                    (tipo === 'OBJETIVA' && (numOpcoes < 4 || numOpcoes > 5))) {
                    throw new Error(`Número de opções INVÁLIDO`);
                }

                const opcoes = alternativas.slice(0, numOpcoes).map(alternativa => ({
                    alternativa,
                    descricao: arrayRespostas[`#opcao${alternativa}`]  // Descrição padrão se não existir
                }));

                if (!topicosSelecionados) {
                    throw new Error("Selecione pelo menos um tópico")
                }

                const createQuestao = await Questao.create({
                    pergunta,
                    titulo,
                    id_area: areaId,
                    id_usuario,
                    tipo // Usa o novo ID do vestibular
                });

                if (!topicosSelecionados) {
                    throw new Error("Erro ao criar questao")
                }

                await createQuestao.addTopico(topicosSelecionados)

                for (let opcao of opcoes) {
                    let isTrue = correta === opcao.alternativa ? true : false;
                    await Opcao.create({
                        id_questao: createQuestao.id_questao,
                        descricao: JSON.stringify(opcao.descricao),
                        alternativa: opcao.alternativa,
                        correta: isTrue
                    })
                }

                res.status(201).redirect('/usuario/inicioLogado');
            } catch (error) {
                console.error(error);
                req.session.errorMessage = error.message;
                await new Promise((resolve, reject) => {
                    req.session.save(err => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                return res.redirect(req.session.lastGetUrl || '/');
            }
        },
        edit: async (req, res) => { // ! Antigo UpdateQuestaoController
            const { id,
                titulo,
                pergunta,
                correta,
                respostasSelecionadas,
                areaId,
                topicosSelecionados
            } = req.body;

            let arrayRespostas;

            const alternativas = ['A', 'B', 'C', 'D', 'E'];

            const MIN_OPCOES = 1;
            const MAX_OPCOES = 5;
            console.log(topicosSelecionados)

            try {

                if (!respostasSelecionadas) {
                    throw new Error("Respostas selecionadas não podem estar vazias");
                }

                try {
                    arrayRespostas = JSON.parse(respostasSelecionadas);
                    if (typeof arrayRespostas !== 'object' || arrayRespostas === null) {
                        throw new Error("Formato de respostas inválido");
                    }
                } catch (parseError) {
                    throw new Error("Erro ao processar respostas: formato JSON inválido");
                }

                const numOpcoes = Object.keys(arrayRespostas).length;

                const questao = await Questao.findByPk(id, {
                    include: [{
                        model: Opcao,
                        as: 'Opcao'
                    }
                    ]
                });

                if (numOpcoes < MIN_OPCOES || numOpcoes > MAX_OPCOES) {
                    throw new Error(`Número de opções deve ser entre ${MIN_OPCOES} e ${MAX_OPCOES}`);
                }


                if ((questao.tipo === 'DISSERTATIVA' && numOpcoes !== 1) ||
                    (questao.tipo === 'OBJETIVA' && (numOpcoes < 4 || numOpcoes > 5))) {
                    throw new Error(`Número de opções INVÁLIDO`);
                }


                const opcoes = alternativas.slice(0, numOpcoes).map(alternativa => ({
                    alternativa,
                    descricao: arrayRespostas[`#opcao${alternativa}`].content,
                    id: arrayRespostas[`#opcao${alternativa}`].id// Descrição padrão se não existir
                }));

                if (!questao) {
                    throw new Error('Questão não encontrada');
                }

                await atualizarRelacaoTopicos(id, topicosSelecionados, areaId);

                await Questao.update({
                    titulo: titulo,
                    pergunta: pergunta,
                }, {
                    where: { id_questao: id }
                });

                if (!opcoes) {
                    throw new Error("Opcoes selecionadas não pode ser vazia");
                }

                for (let opcao of opcoes) {
                    const updateData = {
                        descricao: JSON.stringify(opcao.descricao),
                        alternativa: opcao.alternativa,
                    };
                    if (correta) {
                        updateData.correta = correta === opcao.alternativa;
                    }
                    await Opcao.update(updateData, {
                        where: { id_opcao: opcao.id }
                    });
                }

                res.redirect('/professor/questoes');

            } catch (error) {
                console.error(error);
                req.session.errorMessage = error.message;
                await new Promise((resolve, reject) => {
                    req.session.save(err => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                return res.redirect(req.session.lastGetUrl || '/');
            }
        },
        addImage: async (req, res) => { // ? Antigo uploads/editorImageUploadController.js
            try {
                // Verifica se uma imagem foi enviada
                if (!req.file) {
                    throw new Error('Nenhum arquivo enviado.');
                }

                const url = `/uploads/${req.file.filename}`;

                if (!url) {
                    throw new Error('Erro no upload da imagem');
                }

                res.status(200).json(url);

            } catch (error) {

                console.error(error);
                req.session.errorMessage = error.message;
                await new Promise((resolve, reject) => {
                    req.session.save(err => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                return res.redirect(req.session.lastGetUrl || '/');
            }
        }
    }
    static simulados = {
        addQuestion: async (req, res) => {
            const { simuladoId } = req.params;
            const { selectedQuestionIds } = req.body;

            try {
                const idsInteiros = selectedQuestionIds.split(',').map(Number);

                const simulado = await Simulado.findByPk(simuladoId);

                if (!simulado) {
                    throw new Error('Simulado não encontrado.');
                }
                if (!idsInteiros) {
                    throw new Error('Questões não selecionadas.');
                }

                await simulado.addQuestao(idsInteiros);

                res.redirect(`/simulados/meus-simulados`);
            } catch (error) {
                console.error(error);
                req.session.errorMessage = error.message;
                await new Promise((resolve, reject) => {
                    req.session.save(err => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                return res.redirect(req.session.lastGetUrl || '/');
            }
        },
        edit: async (req, res) => {
            const { simuladoId } = req.params;
            const { titulo, descricao, tipo } = req.body;

            try {
                if (!titulo || !descricao || !tipo) {
                    throw new Error("Dados Invalidos !!! ")
                }

                const [updated] = await Simulado.update({
                    titulo: titulo,
                    descricao: descricao,
                    tipo: tipo
                }, {
                    where: {
                        id_simulado: simuladoId
                    }
                });

                if (!updated) {
                    throw new Error('Simulado não encontrado ou não atualizado');
                }
                res.redirect("/simulados/meus-simulados")
            } catch (error) {
                console.error(error);
                req.session.errorMessage = error.message;
                await new Promise((resolve, reject) => {
                    req.session.save(err => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                return res.redirect(req.session.lastGetUrl || '/');
            }
        },
        register: async (req, res) => {
            const { titulo, descricao, tipo, selectedQuestionIds } = req.body;
            const usuarioId = req.session.userId;
            try {

                if (!titulo || !descricao || !tipo ) {
                    return res.status(400).json({ message: 'Dados inválidos: título, descrição, tipo e modo são obrigatórios.' });
                }


                if (!usuarioId) {
                    return res.status(401).json({ message: 'Usuário não autenticado.' });
                }

                if (!selectedQuestionIds || !Array.isArray(selectedQuestionIds) || selectedQuestionIds.length === 0) {
                    return res.status(400).json({ message: 'Nenhuma questão selecionada.' });
                }

                // Format tipo to uppercase
                const tipoFormatado = tipo.toUpperCase();

                // Convert selectedQuestionIds to integers and filter out invalid IDs
                const idsInteiros = selectedQuestionIds
                    .map(id => parseInt(id, 10))
                    .filter(id => !isNaN(id));

                if (idsInteiros.length === 0) {
                    return res.status(400).json({ message: 'IDs de questões inválidos.' });
                }

                // Create simulado
                const simulado = await Simulado.create({
                    titulo,
                    descricao,
                    id_usuario: usuarioId,
                    tipo: tipoFormatado,
                     // Include modo if your model supports it
                });

                if (!simulado) {
                    return res.status(500).json({ message: 'Erro ao criar simulado.' });
                }

                // Associate questions with simulado
                await simulado.addQuestao(idsInteiros);

                // Send success response
                return res.status(201).json({ message: 'Simulado criado com sucesso!' });

            } catch (error) {
                console.error(error);
                req.session.errorMessage = error.message;
                await new Promise((resolve, reject) => {
                    req.session.save(err => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                return res.redirect(req.session.lastGetUrl || '/');
            }
        },
        removeQuestion: async (req, res) => {
            const { simuladoId } = req.params;
            const { questoesSelecionadas } = req.body;

            try {
                // Primeiro, verifique se o simulado existe
                const simulado = await Simulado.findByPk(simuladoId, {
                    include: [{
                        model: Questao,
                        as: 'Questao'
                    }]
                });

                if (!simulado) {
                    throw new Error('Simulado não encontrado.');
                }
                if (!questoesSelecionadas || questoesSelecionadas.length === 0) {
                    throw new Error('Questões não selecionadas.');
                }

                await simulado.removeQuestao(questoesSelecionadas);

                res.redirect(`/simulados/meus-simulados`);
            } catch (error) {
                console.error(error);
                req.session.errorMessage = error.message;
                await new Promise((resolve, reject) => {
                    req.session.save(err => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                return res.redirect(req.session.lastGetUrl || '/');
            }
        },
        delete: async (req, res) => {
            const { simuladoId } = req.params;

            try {
                const simulado = await Simulado.findByPk(simuladoId, {
                    include: [{
                        model: Questao,
                        as: 'Questao'
                    }]
                });

                if (!simulado) {
                    throw new Error('Simulado não encontrado.');
                }

                await simulado.destroy()

                res.redirect(`/simulados/meus-simulados`);
            } catch (error) {
                console.error(error);
                req.session.errorMessage = error.message;
                await new Promise((resolve, reject) => {
                    req.session.save(err => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                return res.redirect(req.session.lastGetUrl || '/');
            }
        },
        submit: async (req, res) => {
            const { questoes, respostas } = req.body;
            const { userId } = req.session;
            const { simuladoId } = req.params;
            const respostasDissertativas = respostas;

            try {
                const simulado = await Simulado.findByPk(simuladoId)

                if (!simulado) {
                    throw new Error('Simulado nao encontrado.');
                }

                if (questoes && Object.keys(questoes).length > 0) {

                    const questoesObj = questoes.reduce((acc, item) => {
                        const [questaoId, opcaoId] = item.split('-');
                        acc[questaoId] = opcaoId;
                        return acc;
                    }, {});



                    for (let questaoId in questoesObj) {
                        const opcaoId = questoesObj[questaoId];

                        await Resposta.create({
                            resposta: "", // O ID da opção é salvo no campo resposta
                            tipo: 'OBJETIVA',
                            id_opcao: opcaoId,
                            id_usuario: userId, // Ajuste conforme necessário
                            id_simulado: simuladoId, // Ajuste conforme necessário
                            id_questao: questaoId,
                        });
                    }
                }

                // Processa as respostas dissertativas, se houver
                if (respostasDissertativas && Object.keys(respostasDissertativas).length > 0) {
                    for (let key in respostasDissertativas) {
                        const questaoId = key.replace('questao_', '');
                        const resposta = respostasDissertativas[key];

                        await Resposta.create({
                            resposta: resposta,
                            tipo: 'DISSERTATIVA',
                            id_usuario: userId, // Ajuste conforme necessário
                            id_simulado: simuladoId, // Ajuste conforme necessário
                            id_questao: questaoId,
                        });
                    }
                }

                await new Promise(resolve => setTimeout(resolve, 1000));


                res.status(200).redirect(`/simulados/${simulado.id_simulado}/gabarito`)


            } catch (error) {
                console.error(error);
                req.session.errorMessage = error.message;
                await new Promise((resolve, reject) => {
                    req.session.save(err => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                return res.redirect(req.session.lastGetUrl || '/');
            }
        },
    }
    static topicos = {
        edit: async (req, res) => {
            const { id, nome } = req.body;
            try {
                // Encontre o tópico pelo ID
                const topico = await Topico.findByPk(id);

                if (!topico) {
                    throw new Error('Tópico não encontrado.');
                }

                if (!nome) {
                    throw new Error('Nome não pode ser vazio.');
                }

                await topico.update({ nome });

                res.redirect('/professor/topicos');
            } catch (error) {
                console.error(error);
                req.session.errorMessage = error.message;
                await new Promise((resolve, reject) => {
                    req.session.save(err => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                return res.redirect(req.session.lastGetUrl || '/');
            }
        },
        register: async (req, res) => {
            const { topico, areaIdTopico } = req.body;
            const usuarioId = req.session.userId;
            const referer = req.headers.referer || '';

            try {

                // Verifica se os campos obrigatórios estão preenchidos
                if (!topico || !areaIdTopico || !usuarioId) {
                    throw new Error('Os campos tópico e areaId são obrigatórios.');
                }

                const novoTopico = await Topico.create({
                    nome: topico,
                    id_area: areaIdTopico,
                    id_usuario: usuarioId
                });

                // Verifica a URL de origem e responde adequadamente
                if (referer.includes('/professor/topicos/criar')) {
                    return res.redirect('/professor/topicos');
                } else if (referer.includes('/professor/questoes')) {
                    return res.status(201).json(novoTopico);
                }

                // Fallback para qualquer outra origem
                return res.status(201).json(novoTopico);

            } catch (error) {
                console.error(error);
                req.session.errorMessage = error.message;
                await new Promise((resolve, reject) => {
                    req.session.save(err => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                return res.redirect(req.session.lastGetUrl || '/');
            }
        },
        getAll: async (req, res) => {
            const { id } = req.params;

            try {

                const topics = await Topico.findAll({
                    where: { id_area: id },
                });

                res.status(200).json(topics);
            } catch (error) {
                console.error(error);
                req.session.errorMessage = error.message;
                await new Promise((resolve, reject) => {
                    req.session.save(err => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                return res.redirect(req.session.lastGetUrl || '/');
            }
        },
    }
    static usuarios = {
        changeImg: async (req, res) => { // ? Antigo uploads/profileImageUploadControllers.js
            try {
                // Verifica se uma imagem foi enviada
                if (!req.file) {
                    throw new Error('Nenhum arquivo enviado.');
                }

                const idUsuario = req.session.userId;
                const caminhoImagem = `/uploads/${req.file.filename}`;

                // Obtém o usuário atual
                const usuario = await Usuario.findByPk(idUsuario);

                // Remove a imagem antiga se existir
                if (usuario.imagem_perfil) {
                    removeFileFromUploads(usuario.imagem_perfil);
                }

                // Verifica se uma nova imagem foi recebida
                if (!caminhoImagem) {
                    throw new Error('Nenhum arquivo enviado.');
                }

                // Atualiza o banco de dados com a nova imagem
                await Usuario.update({ imagem_perfil: caminhoImagem }, { where: { id_usuario: idUsuario } });

                // Atualiza a sessão com a nova imagem
                req.session.imagemPerfil = caminhoImagem;

                await new Promise((resolve, reject) => {
                    req.session.save(err => {
                        if (err) reject(err);
                        else resolve();
                    });
                });

                // Redireciona para a página de perfil
                res.status(200).redirect(`/usuario/perfil`);
            } catch (error) {
                console.error(error);
                req.session.errorMessage = error.message;
                await new Promise((resolve, reject) => {
                    req.session.save(err => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                return res.redirect(req.session.lastGetUrl || '/');
            }
        },
        delete: async (req, res) => {
            const id = req.session.userId;
            try {
                if (id != req.params.id) {
                    throw new Error("Erro ao excluir usuario")
                }

                await Usuario.destroy({
                    where: {
                        id_usuario: req.params.id
                    }
                }
                );
                req.session.destroy();
                res.status(200).redirect('/usuario/login');
            } catch (error) {
                console.error(error);
                req.session.errorMessage = error.message;
                await new Promise((resolve, reject) => {
                    req.session.save(err => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                return res.redirect(req.session.lastGetUrl || '/');
            }
        },
        edit: async (req, res) => {
            const id = req.session.userId;
            const idUsuarioParaEditar = Number(req.params.id);
            try {

                // Verifica se o usuário está tentando editar seu próprio perfil
                if (id !== idUsuarioParaEditar) {
                    req.session.destroy();
                    return res.redirect('/usuario/login');
                }

                const { senha, nome, usuario, email, novasenha } = req.body;

                // Verifica se pelo menos um campo foi preenchido
                if (!nome && !usuario && !email && !senha && !novasenha) {
                    throw new Error('Pelo menos um campo deve ser preenchido.');
                }

                // Objeto para armazenar os campos a serem atualizados
                const updateFields = {};

                // Flag para verificar se a senha foi alterada
                let senhaAlterada = false;


                if (senha && novasenha) {
                    const usuarioAtual = await Usuario.findByPk(idUsuarioParaEditar);

                    if (!usuarioAtual) {
                        throw new Error('Usuario não encontrado.');
                    }

                    const senhaCorreta = await bcrypt.compare(senha, usuarioAtual.senha);

                    if (!senhaCorreta) {
                        throw new Error('A senha atual está incorreta.');
                    }

                    updateFields.senha = await bcrypt.hash(novasenha, 10);

                    if (!updateFields.senha) {
                        throw new Error('Erro ao processar nova senha.');
                    }

                    senhaAlterada = true;
                }

                // Adiciona campos não vazios ao objeto de atualização
                if (nome) updateFields.nome = nome;
                if (usuario) updateFields.usuario = usuario;
                if (email) updateFields.email = email;

                // Realiza a atualização em uma única chamada se houver campos para atualizar
                if (Object.keys(updateFields).length > 0) {
                    await Usuario.update(updateFields, {
                        where: { id_usuario: idUsuarioParaEditar }
                    });

                    // Atualiza a sessão com os novos dados
                    if (nome) {
                        req.session.nomeUsuario = nome;
                    }
                    if (usuario) {
                        req.session.nomeUsuario = usuario;
                    }
                    // Força a sessão a salvar as alterações
                    await new Promise((resolve) => req.session.save(resolve));
                }

                // Se a senha foi alterada, desloga o usuário
                if (senhaAlterada) {
                    req.session.destroy();
                    return res.status(200).redirect('/usuario/login');
                }

                res.status(200).redirect(`/usuario/perfil`);
            } catch (error) {
                console.error(error);
                req.session.errorMessage = error.message;
                await new Promise((resolve, reject) => {
                    req.session.save(err => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                return res.redirect(req.session.lastGetUrl || '/');
            }
        }
    }
}

exports.Database = Database
