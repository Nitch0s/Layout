class TodoApp {
    constructor() {
        this.tasks = []; // Array of {id: number, text: string, done: boolean}
        this.nextId = 1;

        // DOM elements
        this.elements = {
            taskInput: document.getElementById('taskInput'),
            addBtn: document.getElementById('addBtn'),
            saveBtn: document.getElementById('saveBtn'),
            loadBtn: document.getElementById('loadBtn'),
            loadFile: document.getElementById('loadFile'),
            taskList: document.getElementById('taskList')
        };

        this.initEventListeners();
        this.render();
    }

    initEventListeners() {
        // Add task
        this.elements.addBtn.addEventListener('click', () => this.addTask());
        this.elements.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Save/Load
        this.elements.saveBtn.addEventListener('click', () => this.saveToFile());
        this.elements.loadBtn.addEventListener('click', () => this.elements.loadFile.click());
        this.elements.loadFile.addEventListener('change', (e) => this.loadFromFile(e));

        // Drag & Drop
        this.elements.taskList.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('task-item')) {
                e.target.classList.add('dragging');
                e.dataTransfer.setData('text/plain', e.target.dataset.id);
            }
        });

        this.elements.taskList.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('task-item')) {
                e.target.classList.remove('dragging');
            }
        });

        this.elements.taskList.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        this.elements.taskList.addEventListener('drop', (e) => {
            e.preventDefault();
            const draggedId = e.dataTransfer.getData('text/plain');
            const draggedTask = this.tasks.find(t => t.id == draggedId);
            if (!draggedTask) return;

            const dropTarget = e.target.closest('.task-item');
            if (dropTarget) {
                const dropId = parseInt(dropTarget.dataset.id);
                const dropIndex = this.tasks.findIndex(t => t.id === dropId);
                const draggedIndex = this.tasks.findIndex(t => t.id === draggedTask.id);

                // Reorder
                this.tasks.splice(draggedIndex, 1);
                this.tasks.splice(dropIndex, 0, draggedTask);
                this.render();
            }
        });
    }

    addTask() {
        const text = this.elements.taskInput.value.trim();
        if (!text) return;

        this.tasks.push({
            id: this.nextId++,
            text: text,
            done: false
        });

        this.elements.taskInput.value = '';
        this.render();
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.render();
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.done = !task.done;
            this.render();
        }
    }

    editTask(id, newText) {
        const task = this.tasks.find(t => t.id === id);
        if (task && newText.trim()) {
            task.text = newText.trim();
            this.render();
        }
    }

    startEditing(id) {
        const taskElement = document.querySelector(`[data-id="${id}"] .task-text`);
        if (taskElement) {
            taskElement.focus();
            // Select the text for easier editing
            const range = document.createRange();
            range.selectNodeContents(taskElement);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }

    render() {
        this.elements.taskList.innerHTML = '';

        if (this.tasks.length === 0) {
            const li = document.createElement('li');
            li.className = 'empty-list';
            li.textContent = 'Давай придумаем чем заняться!';
            this.elements.taskList.appendChild(li);
            return;
        }

        this.tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.done ? 'done' : ''}`;
            li.draggable = true;
            li.dataset.id = task.id;

            li.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.done ? 'checked' : ''} onchange="app.toggleTask(${task.id})">
                <span class="task-text" contenteditable="true" onblur="app.editTask(${task.id}, this.textContent)">${task.text}</span>
                <div class="task-buttons">
                    <button class="btn-toggle" onclick="app.toggleTask(${task.id})">${task.done ? 'Не выполнено' : 'Выполнено'}</button>
                    <button class="btn-edit" onclick="app.startEditing(${task.id})">Редактировать</button>
                    <button class="btn-delete" onclick="app.deleteTask(${task.id})">Удалить</button>
                </div>
            `;

            this.elements.taskList.appendChild(li);
        });
    }

    saveToFile() {
        const data = JSON.stringify({ tasks: this.tasks, nextId: this.nextId }, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tasks.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    loadFromFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.tasks = data.tasks || [];
                this.nextId = data.nextId || this.nextId;
                this.render();
                alert('Файл загружен успешно!');
            } catch (err) {
                alert('Ошибка загрузки файла: ' + err.message);
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset input
    }
}

const app = new TodoApp();