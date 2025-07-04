
async function loadTopicDropdown(AreaId, topicosSelecionados) {
    const loadingContainer = document.getElementById('loading-container');
    const dropdownList = document.getElementById('dropdown-list');

<<<<<<< HEAD
    topicos.forEach(function (topico) {
        topico.id = topico.id_topico
        const listItem = document.createElement('li');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'topicosSelecionados[]';
        checkbox.value = topico.id;

        const label = document.createElement('label');
        label.htmlFor = 'topico-' + topico.id;
        label.textContent = topico.materia;
        
    

        let isSelected = false;
        Topicos.forEach(t => {
            if (t.id_topico === topico.id) {
                isSelected = true;
                return false; // Sair do loop interno
            }
        });
=======
    // Mostra o indicador de carregamento
    loadingContainer.style.display = 'block';
    dropdownList.innerHTML = ''; // Limpa a lista antes de carregar novos itens

    try {
        const response = await fetch(`/professor/topicos/${AreaId}`);
>>>>>>> e4c0146aa0ad84b94d9a5456dba1d13eb96dd188

        // Verifica se a resposta foi bem-sucedida
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.statusText}`);
        }

        const data = await response.json();

        // Garante que topicos seja um array
        const topicos = Array.isArray(data) ? data : [];

        topicos.forEach(topic => {
            const listItem = document.createElement('li');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'topicosSelecionados[]';
            checkbox.value = topic.id_topico;

            const label = document.createElement('label');
            label.htmlFor = 'topico-' + topic.id_topico;
            label.textContent = topic.nome;

            // Verifica se o tópico está selecionado
            let isSelected = topicosSelecionados.some(t => t.id_topico === topic.id_topico);
            checkbox.checked = isSelected; // Inicializa como selecionado

            checkbox.addEventListener('change', function () {
                updateSelectedTopics();
            });

            listItem.appendChild(checkbox);
            listItem.appendChild(label);
            dropdownList.appendChild(listItem);
        });
    } catch (error) {
        console.error("Erro ao adicionar itens ao dropdown:", error);
        alert("Ocorreu um erro ao carregar os tópicos. Tente novamente."); // Mensagem ao usuário
    } finally {
        // Oculte o indicador de carregamento após a conclusão
        loadingContainer.style.display = 'none';
    }
}

// Function to update selected topics
function updateSelectedTopics() {
    const selectedTopics = document.querySelectorAll('#dropdown-list input[type="checkbox"]:checked');
    const selectedTopicIds = Array.from(selectedTopics).map(function (checkbox) {
        return checkbox.id.replace('topico-', '');
    });

    document.getElementById('topicosSelecionados').value = JSON.stringify(selectedTopicIds);
}

// Function to handle search in the dropdown
async function handleSearch(inputValue, areaId) {

    const response = await fetch(`/professor/topicos/${AreaId}`);

    const data = await response.json();
    const topicos = data;
    const dropdownList = document.getElementById('dropdown-list');
    const searchInput = document.getElementById('search');

    // Filter the list based on the search input
    const filteredItems = topicos.filter(item =>
        item.materia.toLowerCase().includes(searchInput.value.toLowerCase())
    );

    // Update the dropdown list with filtered items
    dropdownList.innerHTML = '';
    filteredItems.forEach(item => {
        const listItem = document.createElement('li');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'topicosSelecionados[]';
        checkbox.value = item.id_topico;
        checkbox.id = 'topico-' + item.id_topico;

        const label = document.createElement('label');
        label.htmlFor = 'topico-' + item.id_topico;
        label.textContent = item.nome;

        checkbox.addEventListener('change', function () {
            updateSelectedTopics();
        });

        listItem.appendChild(checkbox);
        listItem.appendChild(label);
        dropdownList.appendChild(listItem);
    });
}

// Event listener for search input
document.getElementById('search').addEventListener('input', function () {
    handleSearch(this.value);
});

// Função auxiliar para criar um item de dropdown
