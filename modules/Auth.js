const { Usuario } = require('../models');
const { Session } = require('../models/Session');
const { sequelize } = require('../models/index');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const store = new SequelizeStore({ db: sequelize, tableName: "sessions", model: Session })
const bcrypt = require('bcrypt');

// const ArcanaFlow = require('../logs/ArcanaFlow.js')


// ArcanaFlow.addEntity("Auth", "red")
// ArcanaFlow.addEntity("Auth.login", "red")

class Auth {
    static async login(req, res) {
        const { usuario, senha } = req.body;

        try {
            if (!usuario || !senha) {
                throw new Error("Usuario ou Senha invalidos");
            }

            const usuarioEncontrado = await Usuario.findOne({
                where: { usuario: usuario }
            });

            if (!usuarioEncontrado) {
                // ArcanaFlow.error('Auth.login', 'Usuario nao encontrado');
                throw new Error("Usuario ou Senha invalidos");
            }

            const senhaCorreta = await bcrypt.compare(senha, usuarioEncontrado.senha);

            if (!senhaCorreta) {
                // ArcanaFlow.error('Auth.login', `Usuario ou senha invalidos`);
                throw new Error("Usuario ou Senha invalidos");
            }


            req.session.login = true;
            req.session.userId = usuarioEncontrado.id_usuario;
            req.session.perfil = usuarioEncontrado.tipo_perfil;
            req.session.nomeUsuario = usuarioEncontrado.usuario;
            req.session.imagemPerfil = usuarioEncontrado.imagem_perfil;

            await new Promise((resolve, reject) => {
                req.session.save(err => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            return res.redirect('/usuario/inicioLogado');
        } catch (error) {

            res.cookie('errorMessage', error.message);
            return res.redirect(req.session.lastGetUrl || '/');
        }
    }
    static async logout(req, res) {
        try {
            const sessionID = req.sessionID;

            if (!sessionID) {
                return res.redirect('/usuario/login');
            }

            res.clearCookie("connect.sid", { path: '/' });

            req.session.destroy((err) => {
                if (err) {
                    console.error("Erro ao destruir a sessão:", err.message);
                    return res.status(500).send("Erro ao destruir a sessão");
                }
                store.destroy(sessionID);

                res.redirect('/usuario/login');
            });

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

    static async cadastro(req, res) {
        const { nome, usuario, senha, email, perfil } = req.body;

        if (!nome || !usuario || !senha || !email || !perfil) {
            throw new Error("Dados Invalidos ou Incompletos")
        }
        const senhaCriptografada = await bcrypt.hash(senha, 10);

        try {
            await Usuario.create({ nome, usuario, senha: senhaCriptografada, email, tipo_perfil: perfil });

            res.status(201).redirect('/login');
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

exports.Auth = Auth