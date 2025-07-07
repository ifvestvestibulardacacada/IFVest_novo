const { Area } = require('../models');
const { Simulado } = require('../models');
const { Topico } = require('../models');
const { Questao } = require('../models');
const { Opcao } = require('../models');
const { Usuario } = require('../models');
const { Resposta } = require('../models');
const { Op } = require('sequelize');

// const { Database } = require('./Database') // Inativo momentâneamente

class Render {
    static auth = {
        cadastro: async (req, res) => {
            let errorMessage = req.session.errorMessage;
            console.log(errorMessage);
            if (errorMessage === null) {
                errorMessage = " ";
            }
            req.session.errorMessage = null;
            res.status(200).render('usuario/cadastro', { errorMessage });
        },
        home: async (req, res) => {
            res.status(200).render('usuario/inicio');
        },
        login: async (req, res) => {
            let errorMessage = req.cookies.errorMessage || '';

            res.clearCookie('errorMessage'); // Limpa a mensagem de erro após exibi-la
            res.status(200).render('usuario/login', { errorMessage });
        }
    }
    static questoes = {
        editar: async (req, res) => {
            const { id } = req.params;
            const perfilUsuario = req.session.perfil;
            const nomeUsuario = req.session.nomeUsuario;
            const imagemPerfil = req.session.imagemPerfil;

            try {



                const Areas = await Area.findAll({
                    include: [{
                        model: Topico,
                        as: 'Topico' // Ajuste conforme necessário, dependendo de como você configurou a associação
                    }]

                })
                const questao = await Questao.findByPk(id, {
                    include: [{
                        model: Opcao,
                        as: 'Opcao' // Certifique-se de que este alias corresponda ao definido na associação
                    }, {
                        model: Topico,
                        as: 'Topico'
                    }]
                });
                const Topicos = await Topico.findAll(
                    {
                        where: {
                            id_area: questao.id_area
                        }
                    }
                )


                if (!questao || !Topicos || !Areas) {
                    return res.status(400).send('Dados não encontrados');
                }

                const Opcoes = await Opcao.findAll({
                    where: {
                        id_questao: questao.id_questao
                    },
                    order: [['alternativa', 'ASC']] // Ordena as opções pela coluna 'alternativa' em ordem ascendente
                });

                if (!Opcoes) {
                    return res.status(400).send('Dados não encontrados');
                }

                const correta = Opcoes.filter(opcao => opcao.correta === true);

                let errorMessage = req.session.errorMessage;

                if (errorMessage === null) {
                    errorMessage = " ";
                }

                req.session.errorMessage = null;

                // res.send(JSON.stringify(questao))
                res.render('professor/editar_questao', { questao, Topicos, Areas, errorMessage, Opcoes, correta, nomeUsuario, perfilUsuario, imagemPerfil });
            } catch (error) {
                console.error(error);
                res.status(500).send('Erro ao buscar questão');
            }
        },
        manutencao: async (req, res) => {
            res.status(200).render('professor/manutencao');
        },
        minhasQuestoes: async (req, res) => {
            const perfilUsuario = req.session.perfil;
            const nomeUsuario = req.session.nomeUsuario;
            const imagemPerfil = req.session.imagemPerfil;
            const usuarioId = req.session.userId;
            const { titulo, areaId, topicosSelecionados, pergunta } = req.query; // 
            const limit = 10;
            const page = parseInt(req.query.page) || 1;
            const offset = (page - 1) * limit;

            try {
                let questoes = await Questao.findAll({
                    where: {
                        id_usuario: usuarioId,
                    },
                    include: [{
                        model: Area,
                        as: 'Area'
                    }, {
                        model: Topico,
                        as: 'Topico'
                    }],
                    limit: limit,
                    offset: offset,
                });
                console.log(1) // ! Log temporário

                const questoesCount = await Questao.count({
                    where: {
                        id_usuario: usuarioId,
                    },
                });
                console.log(2) // ! Log temporário
                const totalPages = Math.ceil(questoesCount / limit);
                console.log(3) // ! Log temporário
                // Buscar todas as áreas para o filtro
                const topicos = await Topico.findAll(); console.log(4) // ! Log temporário
                const Areas = await Area.findAll({
                    include: [{
                        model: Topico,
                        as: 'Topico'
                    }]
                });


                let questoesFiltradas = questoes;
                if (titulo) {
                    questoesFiltradas = questoes.filter(questao => questao.titulo.toLowerCase().includes(titulo.toLowerCase()));
                } console.log(6) // ! Log temporário
                if (areaId && areaId !== "") {
                    questoesFiltradas = questoes.filter(questao => questao.id_area === Number(areaId));
                }
                if (topicosSelecionados && topicosSelecionados !== "") {

                    const topicosIds = Array.isArray(topicosSelecionados) ? topicosSelecionados : topicosSelecionados.split(',').map(id => parseInt(id));
                    questoesFiltradas = questoes.filter(questao => {
                        const topicos = Array.isArray(questao.Topico) ? questao.Topico : [];
                        return topicos.some(topico => topicosIds.includes(topico.id_topico));
                    });
                } console.log(8) // ! Log temporário
                if (pergunta) {
                    questoesFiltradas = questoes.filter(questao => questao.pergunta.toLowerCase().includes(pergunta.toLowerCase()));
                } console.log(9) // ! Log temporário

                let errorMessage = req.session.errorMessage;

                if (errorMessage === null) {
                    errorMessage = " ";
                }

                req.session.errorMessage = null;
                res.status(200).render('professor/minhas_questoes', { questoes: questoesFiltradas, totalPages, page, Areas, topicos, errorMessage, nomeUsuario, perfilUsuario, imagemPerfil });
            } catch (err) {
                console.log('ERRO NO MINHAS QUESTOES')
                console.error(err.message)
                req.session.destroy();
                res.status(500).redirect('/usuario/inicioLogado');
            };
        },
        registrarQuestao: async (req, res) => {
            try {

                const perfilUsuario = req.session.perfil;
                const nomeUsuario = req.session.nomeUsuario;
                const imagemPerfil = req.session.imagemPerfil;

                const tipo = req.params.tipo.toLowerCase();
                const usuarioId = req.session.userId;
                //req.session.tipoQuestao = tipo; // Armazena o tipo de questão na sessão

                const Areas = await Area.findAll({
                    include: [{
                        model: Topico,
                        as: 'Topico' // Ajuste conforme necessário, dependendo de como você configurou a associação
                    }]
                })


                // Mapeamento dos tipos de Questao aos tipos de simulados
                const tipoSimuladoMap = {
                    "objetiva": ['ALEATORIO', 'OBJETIVO'],
                    "dissertativa": ['DISSERTATIVO', 'ALEATORIO']
                };

                // Verifica se o tipo de questão é válido
                if (!tipoSimuladoMap[tipo]) {
                    return res.status(400).send('Tipo de questão inválido');
                }

                // Consulta todos os simulados do usuário, filtrando por tipo
                const simulados = await Simulado.findAll({
                    where: {
                        id_usuario: usuarioId,
                        tipo: {
                            [Op.in]: tipoSimuladoMap[tipo]
                        }
                    }
                });
                let errorMessage = req.session.errorMessage;

                if (errorMessage === null) {
                    errorMessage = " ";
                }

                req.session.errorMessage = null;

                // Retorna os simulados filtrados
                res.status(200).render('professor/criar_questao', { Areas, tipo, simulados, errorMessage, nomeUsuario, perfilUsuario, imagemPerfil });
            } catch (error) {
                console.error(error)

                res.status(500).redirect('/usuario/inicioLogado');
            }
        }

    }
    static simulados = {
        adicionarQuestoes: async (req, res) => {
            try {
                const perfilUsuario = req.session.perfil;
                const nomeUsuario = req.session.nomeUsuario;
                const imagemPerfil = req.session.imagemPerfil;
                const simuladoId = req.params.simuladoId;
                const { titulo, areaId, topicosSelecionados } = req.query;
                const page = parseInt(req.query.page) || 1;
                const limit = 10;
                const offset = (page - 1) * limit;

                const simulado = await Simulado.findOne({
                    where: { id_simulado: simuladoId },
                    include: [{
                        model: Questao,
                        as: 'Questao'
                    }]
                });

                if (!simulado) {
                    return res.status(400).send('Simulado não encontrado.');
                }


                const topicos = await Topico.findAll();
                const Areas = await Area.findAll({
                    include: [{
                        model: Topico,
                        as: 'Topico'
                    }]
                });


                let todasQuestoes;
                const tipoQuestao = simulado.tipo === "OBJETIVO" ? 'OBJETIVA' :
                    simulado.tipo === "DISSERTATIVO" ? 'DISSERTATIVA' :
                        null;

                const whereClause = tipoQuestao ? { tipo: { [Op.eq]: tipoQuestao } } : {};

                todasQuestoes = await Questao.findAll({
                    include: [
                        {
                            model: Topico,
                            as: 'Topico',
                            through: { attributes: [] },
                        },
                    ],
                    where: whereClause,
                });

                const questoesJaAssociadas = simulado.Questao.map(q => q.id_questao);
                //
                const questoesDisponiveis = todasQuestoes.filter(q => !questoesJaAssociadas.includes(q.id_questao));

                //filtros
                let questoesFiltradas = questoesDisponiveis;

                // filtro de titulo
                if (titulo) {
                    questoesFiltradas = questoesFiltradas.filter(questao => questao.titulo.toLowerCase().includes(titulo.toLowerCase()));
                }
                // filtro de area
                if (areaId && areaId !== "") {
                    questoesFiltradas = questoesFiltradas.filter(questao => questao.id_area === Number(areaId));
                }
                // filtro de topicos
                if (topicosSelecionados && topicosSelecionados !== "") {
                    const topicosIds = Array.isArray(topicosSelecionados) ? topicosSelecionados : topicosSelecionados.split(',').map(id => parseInt(id));
                    questoesFiltradas = questoesFiltradas.filter(questao => {
                        const topicos = Array.isArray(questao.Topico) ? questao.Topico : [];
                        return topicos.some(topico => topicosIds.includes(topico.id_topico));
                    });
                }

                const questoes = questoesFiltradas.slice(offset, offset + limit);

                const totalQuestoes = questoesFiltradas.length;
                const totalPages = Math.ceil(totalQuestoes / limit);

                const questoesPorArea = {};

                simulado.Questao.forEach(q => {
                    const areaId = q.id_area;
                    if (!questoesPorArea[areaId]) {
                        questoesPorArea[areaId] = 0;
                    }
                    questoesPorArea[areaId]++;
                });
                let errorMessage = req.session.errorMessage;

                if (errorMessage === null) {
                    errorMessage = " ";
                }

                req.session.errorMessage = null;

                res.render('simulado/associar_pergunta_simulado', { simulado, questoes, page, totalPages, Areas, topicos, questoesPorArea, errorMessage, nomeUsuario, perfilUsuario, imagemPerfil });
            } catch (error) {
                console.error(error);
                res.status(500).send('Erro ao carregar formulário de associação de pergunta');
            }
        },
        criarSimulado: async (req, res) => {
            const perfilUsuario = req.session.perfil;
            const nomeUsuario = req.session.nomeUsuario;
            const imagemPerfil = req.session.imagemPerfil;
            const topicos = await Topico.findAll();
            const Areas = await Area.findAll({
                include: [{
                    model: Topico,
                    as: 'Topico'
                }]
            });
            const questoes = await Questao.findAll({
                include: [
                    {
                        model: Topico,
                        as: 'Topico',
                    },
                ],

            });

            let errorMessage = req.session.errorMessage;
            if (errorMessage === null) {
                errorMessage = " ";
            }

            req.session.errorMessage = null;

            res.render('simulado/criar_simulado', { topicos, Areas, questoes, errorMessage, nomeUsuario, perfilUsuario, imagemPerfil });
        },
        editarSimulado: async (req, res) => {
            const simuladoId = req.params.id
            const perfilUsuario = req.session.perfil;
            const nomeUsuario = req.session.nomeUsuario;
            const imagemPerfil = req.session.imagemPerfil;
            try {
                const simulado = await Simulado.findOne({
                    where: { id_simulado: simuladoId },
                });

                if (!simulado) {
                    return res.status(400).send('Simulado não encontrado ');
                }
                let errorMessage = req.session.errorMessage;

                if (errorMessage === null) {
                    errorMessage = " ";
                }
                req.session.errorMessage = null;

                res.render('simulado/editar_simulado', { simulado, errorMessage, nomeUsuario, perfilUsuario, imagemPerfil });
            } catch (err) {
                return res.status(500).json({ error: err.message });
            }
        },
        fazerSimulado: async (req, res) => {
            try {
                const perfilUsuario = req.session.perfil;
                const nomeUsuario = req.session.nomeUsuario;
                const imagemPerfil = req.session.imagemPerfil;
                const simuladoId = req.params.simuladoId;
                let errorMessage = req.session.errorMessage;

                const simulado = await Simulado.findByPk(simuladoId, {
                    include: [{
                        model: Questao,
                        as: 'Questao', // Certifique-se de que este alias corresponda ao definido na associação
                        include: [{
                            model: Opcao,
                            as: 'Opcao' // Certifique-se de que este alias corresponda ao definido na associação
                        },
                        ]
                    }],

                });

                if (errorMessage === null) {
                    errorMessage = " ";
                }

                req.session.errorMessage = null;



                res.render('prova/prova', { simulado, errorMessage, nomeUsuario, perfilUsuario, imagemPerfil });
                //  res.send(simulado)
            } catch (error) {
                console.error('Erro ao buscar perguntas da prova:', error);
                res.status(500).send('Erro ao buscar perguntas da prova.');
            }
        },
        gabarito: async (req, res) => {
            const perfilUsuario = req.session.perfil;
            const nomeUsuario = req.session.nomeUsuario;
            const imagemPerfil = req.session.imagemPerfil;
            const userId = req.session.userId;
            const id_simulado = req.params.simuladoId;
            let respostasDissertativas = [];


            if (isNaN(id_simulado) || id_simulado <= 0) {

                return res.status(400).send('ID de simulado inválido');
            }

            try {
                const simulado = await Simulado.findByPk(id_simulado, {
                    include: [{
                        model: Questao,
                        as: 'Questao', // Certifique-se de que este alias corresponda ao definido na associação
                        include: [{
                            model: Opcao,
                            as: 'Opcao' // Certifique-se de que este alias corresponda ao definido na associação
                        },
                        ]
                    }],
                });


                const questoesComOpcoesCorretas = simulado.Questao;

                if (!questoesComOpcoesCorretas) {
                    return res.status(400).send('Nenhuma questão encontrada');
                }


                const respostasDoUsuario = await Resposta.findAll({
                    where: {
                        id_usuario: userId,
                        id_questao: { [Op.in]: questoesComOpcoesCorretas.map(q => q.id_questao) }
                    },
                    include: [{
                        model: Opcao,
                        as: 'Opcao',
                        required: true
                    }],
                    order: [['createdAt', 'DESC']],
                });

                if (simulado.tipo !== 'OBJETIVO') {
                    respostasDissertativas = await Resposta.findAll({
                        where: {
                            id_usuario: userId,
                            id_questao: { [Op.in]: questoesComOpcoesCorretas.map(q => q.id_questao) },
                            resposta: { [Op.ne]: null }
                        },
                        order: [['createdAt', 'DESC']],
                    });
                } else {
                    respostasDissertativas = [];
                }

                questoesComOpcoesCorretas.forEach(questao => {
                    questao.Opcao.sort((a, b) => a.id_opcao - b.id_opcao);
                });

                let errorMessage = req.session.errorMessage;

                if (errorMessage === null) {
                    errorMessage = " ";
                }

                req.session.errorMessage = null;


                res.render('prova/gabarito', {
                    questoes: questoesComOpcoesCorretas,
                    respostasUsuario: respostasDoUsuario,
                    respostasDissertativas: respostasDissertativas,
                    simulado: simulado, errorMessage,
                    nomeUsuario, perfilUsuario, imagemPerfil
                });


            } catch (error) {
                console.error('Erro ao buscar o gabarito da prova:', error);
                res.status(500).send('Erro ao buscar o gabarito da prova.');
            }
        },
        imprimirSimulado: async (req, res) => {
            try {
                const perfilUsuario = req.session.perfil;
                const nomeUsuario = req.session.nomeUsuario;
                const imagemPerfil = req.session.imagemPerfil;
                const simuladoId = req.params.simuladoId;
                // Verifique se simuladoId é um número
                if (isNaN(simuladoId) || simuladoId <= 0) {
                    return res.status(400).send('ID de simulado inválido');
                }

                const simulado = await Simulado.findByPk(simuladoId, {
                    include: [{
                        model: Questao,
                        as: 'Questao', // Certifique-se de que este alias corresponda ao definido na associação
                        include: [{
                            model: Opcao,
                            as: 'Opcao' // Certifique-se de que este alias corresponda ao definido na associação
                        },
                        ]
                    }],
                });

                res.render('prova/template_prova', { simulado, nomeUsuario, perfilUsuario, imagemPerfil });
            } catch (error) {
                console.error('Erro ao gerar PDF:', error);
                res.status(500).send('Erro ao gerar o PDF');
            }
        },
        meusSimulados: async (req, res) => {
            try {
                const perfilUsuario = req.session.perfil;
                const nomeUsuario = req.session.nomeUsuario;
                const imagemPerfil = req.session.imagemPerfil;
                const { titulo } = req.query;
                const idUsuario = req.session.userId;
                const page = parseInt(req.query.page) || 1;
                const limit = 10;
                const offset = (page - 1) * limit;

                let allSimulados = await Simulado.findAll({
                    where: { id_usuario: idUsuario },
                    order: [['createdAt', 'DESC']]
                });

                if (titulo) {
                    const simulados = allSimulados.filter(s => s.titulo.toLowerCase().includes(titulo.toLowerCase()));
                    allSimulados = simulados
                }

                const totalPages = Math.ceil(allSimulados.length / limit);
                const startIndex = offset;
                const endIndex = offset + limit;
                const simuladosPaginated = allSimulados.slice(startIndex, endIndex);

                let errorMessage = req.session.errorMessage;

                if (errorMessage === null) {
                    errorMessage = " ";
                }
                req.session.errorMessage = null;

                res.render('simulado/meus_simulados', { simulados: simuladosPaginated, currentPage: page, totalPages, errorMessage, nomeUsuario, perfilUsuario, imagemPerfil });
            } catch (error) {
                console.error(error);
                res.status(500).send('Ocorreu um erro ao recuperar os questionários.');
            }
        },
        removerQuestoes: async (req, res) => {
            try {
                const perfilUsuario = req.session.perfil;
                const nomeUsuario = req.session.nomeUsuario;
                const imagemPerfil = req.session.imagemPerfil;
                const simuladoId = req.params.simuladoId;
                const { titulo } = req.query;
                const page = parseInt(req.query.page) || 1;
                const limit = 10;
                const offset = (page - 1) * limit;

                const simulado = await Simulado.findOne({
                    where: { id_simulado: simuladoId },
                    include: [
                        {
                            model: Questao,
                            as: 'Questao', through: { attributes: [] }
                        }
                    ]
                });

                if (!simulado) {
                    return res.status(400).send('Simulado não encontrado');
                }

                const questaoIds = simulado.Questao && simulado.Questao.length > 0 ? simulado.Questao.map(questao => questao.id_questao) : [];

                const todasQuestoes = await Questao.findAll({
                    where: { id_questao: { [Op.in]: questaoIds } },
                    include: [{
                        model: Simulado,
                        as: 'Simulado',
                        where: { id_simulado: simuladoId },
                        through: { attributes: [] }
                    }],
                    limit: limit,
                    offset: offset
                });

                let questoes = todasQuestoes;

                if (titulo) {
                    questoes = todasQuestoes.filter(questao => questao.titulo.toLowerCase().includes(titulo.toLowerCase()));
                }
                const totalQuestoes = await Questao.count({
                    where: { id_questao: { [Op.in]: questaoIds } },
                    include: [{
                        model: Simulado,
                        as: 'Simulado',
                        where: { id_simulado: simuladoId },
                        through: { attributes: [] }
                    }]
                });
                const totalPages = Math.ceil(totalQuestoes / limit);

                let errorMessage = req.session.errorMessage;

                if (errorMessage === null) {
                    errorMessage = " ";
                }

                req.session.errorMessage = null;

                res.render('simulado/remover_questoes', { simulado: simulado, questoes: questoes, page: page, totalPages: totalPages, errorMessage, nomeUsuario, perfilUsuario, imagemPerfil });
            } catch (error) {
                console.error('Erro ao carregar o formulário de edição do simulado:', error);
                res.status(500).send('Erro ao carregar o formulário de edição do simulado.');
            }
        },
        visualizarSimulado: async (req, res) => {
            try {
                let simulados;
                console.log(req.session)
                const perfilUsuario = req.session.perfil;
                const nomeUsuario = req.session.nomeUsuario;
                const imagemPerfil = req.session.imagemPerfil;

                const todosSimulados = await Simulado.findAll({
                    where: {
                        '$Questao.id_questao$': {
                            [Op.not]: null
                        },
                        '$Usuario.tipo_perfil$': 'PROFESSOR'
                    },
                    include: [{
                        model: Questao,
                        as: 'Questao'
                    }, {
                        model: Usuario,
                        as: 'Usuario',
                        attributes: ['tipo_perfil'],
                        where: {
                            tipo_perfil: 'PROFESSOR'
                        }
                    }
                    ]
                });

                if (!todosSimulados) {
                    return res.status(400).send('Simulados não encontrados');
                }
                simulados = todosSimulados;

                const tituloBusca = req.query.titulo;
                if (tituloBusca) {
                    simulados = todosSimulados.filter(s => s.titulo.toLowerCase().includes(tituloBusca.toLowerCase()));
                }

                const tipo = req.query.tipo;
                if (tipo) {
                    simulados = todosSimulados.filter(s => s.tipo.includes(tipo));
                }

                let errorMessage = req.session.errorMessage;

                if (errorMessage === null) {
                    errorMessage = " ";
                }

                req.session.errorMessage = null;

                res.render('simulado/simulados', { simulados, errorMessage, nomeUsuario, perfilUsuario, imagemPerfil });
            } catch (error) {
                console.error(error);
                res.status(500).send('Ocorreu um erro ao recuperar os questionários.');
            }
        },
    }
    static topicos = {
        meusTopicos: async (req, res) => {
            const perfilUsuario = req.session.perfil;
            const nomeUsuario = req.session.nomeUsuario;
            const imagemPerfil = req.session.imagemPerfil;
            const usuarioId = req.session.userId;
            const limit = 10; // Número de Questao por página
            const { materia } = req.query;
            const page = parseInt(req.query.page) || 1; // Página atual, padrão é 1
            const offset = (page - 1) * limit;
            let topicos;
            try {

                // Dentro do bloco try da rota '/questoes'
                const topicosCount = await Topico.count({
                    where: {
                        id_usuario: usuarioId,
                    },
                });

                const totalPages = Math.ceil(topicosCount / limit);

                const topicosSemFiltro = await Topico.findAll({
                    where: {
                        id_usuario: usuarioId,
                    },
                    limit: limit,
                    offset: offset,
                });

                if (materia) {
                    topicos = topicosSemFiltro.filter(topico => topico.nome.toLowerCase().includes(materia.toLowerCase()));

                } else {
                    topicos = topicosSemFiltro;
                }
                let errorMessage = req.session.errorMessage;

                if (errorMessage === null) {
                    errorMessage = " ";
                }

                req.session.errorMessage = null;
                res.status(200).render('professor/meus_topicos', { topicos, totalPages, page, errorMessage, nomeUsuario, perfilUsuario, imagemPerfil });

            } catch (err) {
                console.error(err.message)
                req.sesssion.destroy();
                res.status(500).redirect('/usuario/inicioLogado');
            };
        },
        criarTopico: async (req, res) => {
            try {
                let errorMessage = req.session.errorMessage;
                const perfilUsuario = req.session.perfil;
                const nomeUsuario = req.session.nomeUsuario;
                const imagemPerfil = req.session.imagemPerfil;

                const Areas = await Area.findAll({
                    include: [{
                        model: Topico,
                        as: 'Topico' // Ajuste conforme necessário, dependendo de como você configurou a associação
                    }]
                });

                res.status(200).render('professor/criar_topicos', { Areas, errorMessage, nomeUsuario, perfilUsuario, imagemPerfil });
            } catch (err) {
                console.error(err.message)
                req.sesssion.destroy();
                res.status(500).redirect('/usuario/inicioLogado');
            };
        }
    }
    static usuarios = {
        editarUsuario: async (req, res) => {
            try {
                let errorMessage = req.session.errorMessage;
                const perfilUsuario = req.session.perfil;
                const nomeUsuario = req.session.nomeUsuario;
                const imagemPerfil = req.session.imagemPerfil;

                if (!req.session.userId) {
                    return res.status(300).send("Você precisa estar logado para acessar esta página.");
                }
                const usuario = await Usuario.findByPk(req.session.userId);

                if (!usuario) {
                    return res.status(400).send("Erro ao buscar usuario");
                }


                if (errorMessage === null) {
                    errorMessage = " ";
                }

                req.session.errorMessage = null;
                res.render('usuario/editar_usuario', { usuario, errorMessage, nomeUsuario, perfilUsuario, imagemPerfil });
            } catch (err) {
                console.error(err)
                res.redirect('/login');
            }
        },
        inicioLogado: async (req, res) => {
            res.locals.currentPage = "inicio"
            const perfilUsuario = req.session.perfil;
            const nomeUsuario = req.session.nomeUsuario;
            const imagemPerfil = req.session.imagemPerfil;
            const id = req.session.userId;

            console.log(id)
            try {
                const usuario = await Usuario.findByPk(id);
                console.log(usuario)

                if (!usuario) {
                    return res.status(400).send("Erro ao buscar usuario ");
                }
                res.status(200).render('usuario/inicio_logado', { nomeUsuario, perfilUsuario, imagemPerfil });
            } catch (err) {
                console.error(err)
                req.session.destroy();
                res.redirect('/login');
            }
        },
        perfilUsuario: async (req, res) => {
            res.locals.currentPage = "perfil"
            const perfilUsuario = req.session.perfil;
            const nomeUsuario = req.session.nomeUsuario;
            const imagemPerfil = req.session.imagemPerfil;
            const id = req.session.userId;
            try {
                const usuario = await Usuario.findByPk(id);

                if (!usuario) {
                    return res.status(400).send("Erro ao buscar usuario");
                }
                res.status(200).render('usuario/perfil_usuario', { usuario, nomeUsuario, perfilUsuario, imagemPerfil });
            } catch (err) {
                console.error(err)
                res.redirect('/perfil');
            }
        },
        sobreNos: async (req, res) => {
            res.locals.currentPage = "sobreNos"
            const perfilUsuario = req.session.perfil;
            const nomeUsuario = req.session.nomeUsuario;
            const imagemPerfil = req.session.imagemPerfil;
            res.status(200).render('desenvolvedores/sobre_nos', { nomeUsuario, perfilUsuario, imagemPerfil });
        }
    }
}

// Render.auth.cadastro(req, res)

exports.Render = Render