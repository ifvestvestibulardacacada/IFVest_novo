'use strict';

const { ENUM } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('Usuario', {
      id_usuario: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      nome: {
        type: Sequelize.STRING,
        allowNull: false
      },
      usuario: {
        type: Sequelize.STRING,
        allowNull: false
      },
      verificacao: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      senha: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      tipo_perfil: {
        type: Sequelize.ENUM({
          values: ['USUARIO', 'PROFESSOR', 'ADMIN']
        }),
        allowNull: true,
        defaultValue: 'USUARIO'
      },
      imagem_perfil:{
        type: Sequelize.STRING,
        allowNull: true
      },

      createdAt:{
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      updatedAt:{
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    })
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable("Usuario");
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};