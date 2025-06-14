const { Topico } = require('../models');
const { Questao } = require('../models');


async function atualizarRelacaoTopicos(idQuestao, topicosSelecionados, areaId) {
  try {
    const questao = await Questao.findByPk(idQuestao, {
      include: [{
        model: Topico,
        as: 'Topico',
        attributes: ['id_topico']
      }]
    });

    // Verificar se a questão foi encontrada
    if (!questao) {
      throw new Error('Questão não encontrada');
    }

    const topicosIdsAtuais = questao.Topico.map(topico => topico.id_topico);

    // Remover tópicos que não estão mais selecionados
    await questao.removeTopico(topicosIdsAtuais);

    // Adicionar novos tópicos selecionados
    if (areaId && areaId !== questao.id_area) {
      // Atualizar a área da questão
      await Questao.update({
        id_area: areaId,
      }, {
        where: { id_questao: idQuestao }
      });
    }

    await questao.addTopico(topicosSelecionados);
  } catch (error) {
    console.error('Erro ao atualizar relação de tópicos:', error);
    throw error;
  }
}

  module.exports = {
    atualizarRelacaoTopicos
  };