let taskStorage = [
    {
        id: "23",
        name: "Task1",
        shortDesc: "shortDesc",
        fullDesc: "fullDesc",
        date: "date",
        status: true,
    },
];

const apiUrl = "http://localhost:3000/api/todos";
let isLoading = false;
let sortStatus = false;
/*
*/


function formatDate(d) {
    const date = new Date(d);

    let datePart = [
        date.getDate(),
        date.getMonth() + 1,
        date.getFullYear()
    ].map((n, i) => n.toString().padStart(i === 2 ? 4 : 2, "0")).join(".");
    
    let timePart = [
        date.getHours(),
        date.getMinutes()
    ].map((n, i) => n.toString().padStart(2, "0")).join(":");

    return datePart + " " + timePart;
}

function throttle(cb, ms) {
    let waiting = false;

    return function(...args) {
        if(!waiting) {
            cb.apply(this, args);
            waiting = true;

            setTimeout(function () {
                waiting = false;
            }, ms)
        }
    }
}

function createTodoItem(todo) {
    const itemO = document.createElement("div");
    itemO.classList.add("todo-list__item");

    itemO.innerHTML = 
    `
        <div class="todo-list__row">
            <div class="todo-list__content">
                <div class="todo-list__title">${todo.name}</div>
                <div class="todo-list__short-desc">${todo.shortDesc}</div>
            </div>
            <div class="todo-list__tools">
                <div class="status">
                    <span class="status__checkmark"></span>
                    <input type="checkbox" name="status" ${todo.status ? 'checked' : ''}>
                </div>
                <div class="todo-list__create-date">${formatDate(todo.date)}</div>
            </div>
        </div>
    `;

    itemO.addEventListener("click", (e) => {
        e.preventDefault();
        openModal(todo.id);
    })

    return itemO;
}

function createSearchItem(todo) {
    const itemO = document.createElement("div");
    itemO.classList.add("search__item");
    itemO.textContent = todo.name;

    itemO.addEventListener("click", (e) => {
        e.preventDefault();
        openModal(todo.id);
    })

    return itemO;
}

function openModal(id) {
    const task = taskStorage.filter(t => t.id == id)[0];

    if(!task) return;

    const modal = document.querySelector(".modal");
    modal.classList.remove("hidden");

    modal.querySelector(".modal__title").textContent = task.name;
    modal.querySelector(".modal__date").textContent = formatDate(task.date);
    modal.querySelector(".status input").checked = task.status;
    modal.querySelector(".modal__body").textContent = task.fullDesc;
}

function showLoading() {
    const todolist = document.querySelector(".todo-list");
    todolist.innerHTML = 
    `
        <div class="todo-list__item">
            <div class="lds-dual-ring"></div>
        </div>
    `;
}

function renderTodolist(tasks) {
    const todolist = document.querySelector(".todo-list");
    todolist.innerHTML = "";

    tasks.forEach(task => {
        if(sortStatus) {
            if(!task.status) {
                todolist.appendChild(createTodoItem(task));
            }
        } else {
            todolist.appendChild(createTodoItem(task));
        }
    });
}

function renderSearchList(tasks) {
    const searchlist = document.querySelector(".search__list");
    searchlist.innerHTML = "";

    if(tasks.length == 0) searchlist.classList.add("hidden");
    else searchlist.classList.remove("hidden");

    tasks.forEach(task => {
        if(sortStatus) {
            if(!task.status) {
                searchlist.appendChild(createSearchItem(task));
            }
        } else {
            searchlist.appendChild(createSearchItem(task));
        }
    });
}

async function getTasks()
{
    isLoading = true;
    showLoading();

    const res = await fetch(apiUrl);
    const tasks = await res.json();

    taskStorage = tasks;
    isLoading = false;

    renderTodolist(tasks);
}

async function getTasksInDateInterval(from, to, status)
{
    isLoading = true;
    showLoading();

    let u;

    if(status) u = `${apiUrl}/date?from=${new Date(from).getTime()}&to=${new Date(to).getTime()}&status=${status}`;
    else u = `${apiUrl}/date?from=${new Date(from).getTime()}&to=${new Date(to).getTime()}`;

    const res = await fetch(u);
    const tasks = await res.json();

    taskStorage = tasks;
    isLoading = false;

    renderTodolist(tasks);
}

async function getTodayTasks()
{
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    await getTasksInDateInterval(today, tomorrow)
}

async function getWeekTasks()
{
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    await getTasksInDateInterval(today, nextWeek)
}

function sortTasks() {
    taskStorage.sort((l, r) => {
        ld = new Date(l.date);
        rd = new Date(r.date);
        
        return ld < rd ? -1 : (rd < ld ? 1 : 0);
    });

    renderTodolist(taskStorage);
}

async function searchTasks(q) {
    if(q == "")  document.querySelector(".search__list").classList.add("hidden");
    
    isLoading = true;

    const res = await fetch(`${apiUrl}/find?q=${q}`);
    const tasks = await res.json();

    isLoading = false;

    renderTodolist(tasks);
    renderSearchList(tasks);
}

function initBtn() {
    document.querySelector("[data-tool='sort']").addEventListener("click", (e) => {
        if(isLoading) return;
        e.preventDefault();
    
        sortTasks();
    });

    document.querySelector("[data-tool='today']").addEventListener("click", (e) => {
        if(isLoading) return;
        e.preventDefault();
    
        getTodayTasks()
    });

    document.querySelector("[data-tool='week']").addEventListener("click", (e) => {
        if(isLoading) return;
        e.preventDefault();
        
        getWeekTasks()
    });

    document.querySelector("[data-tool='sort-status']").addEventListener("click", (e) => {
        e.preventDefault();

        document.querySelector("[data-tool='sort-status'] input").checked = !document.querySelector("[data-tool='sort-status'] input").checked;
        sortStatus = document.querySelector("[data-tool='sort-status'] input").checked;
        renderTodolist(taskStorage);
    });
    document.querySelector("[data-tool='sort-status'] input").addEventListener("click", (e) => {
        e.stopPropagation()
        sortStatus = document.querySelector("[data-tool='sort-status'] input").checked;
        renderTodolist(taskStorage);
    });

    document.querySelector("[data-tool='search'] input").addEventListener("input", throttle(function (e) {
        if(isLoading) return;
        searchTasks(e.target.value);
    }, 300));

    $("[data-tool='daterange']").datepicker({
        beforeShowDay: function(date) {
            const date1 = $.datepicker.parseDate($.datepicker._defaults.dateFormat, $("#input1").val());
            const date2 = $.datepicker.parseDate($.datepicker._defaults.dateFormat, $("#input2").val());
            return [true, date1 && ((date.getTime() == date1.getTime()) || (date2 && date >= date1 && date <= date2)) ? "dp-highlight" : ""];
        },
        onSelect: function(dateText) {
            if(isLoading) return;

            const date1 = $.datepicker.parseDate($.datepicker._defaults.dateFormat, $("#input1").val());
            const date2 = $.datepicker.parseDate($.datepicker._defaults.dateFormat, $("#input2").val());
            const selectedDate = $.datepicker.parseDate($.datepicker._defaults.dateFormat, dateText);

            if (!date1 || date2) {
                $("#input1").val(dateText);
                $("#input2").val("");
                $(this).datepicker();
            } else if( selectedDate < date1 ) {
                $("#input2").val( $("#input1").val() );
                $("#input1").val( dateText );
                $(this).datepicker();
            } else {
                $("#input2").val(dateText);
                $(this).datepicker();
            }
            
            if($("#input1").val() == "") return;

            const d1 = new Date($("#input1").val());
            let d2 ;

            if($("#input2").val() == ""){
                d2 = new Date($("#input1").val());
            }
            else d2 = new Date($("#input2").val());

            d2.setDate(d2.getDate() + 1);

            getTasksInDateInterval(d1, d2);
        }
    });

    document.querySelector(".modal").addEventListener("click", (e) => {
        e.preventDefault();

        document.querySelector(".modal").classList.add("hidden");
    });

    document.querySelector(".modal__content").addEventListener("click", (e) => {
        e.stopPropagation();
    });

    document.querySelector(".modal__footer .btn").addEventListener("click", (e) => {
        e.preventDefault();

        document.querySelector(".modal").classList.add("hidden");
    });
}



initBtn();
getTasks();