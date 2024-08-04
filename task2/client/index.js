const serverUrl = "http://localhost:18080";

// Простая реализация наблюдателя (нет никаких проверок, кроме set value, так что пользоваться осторожно)
function Observable(init) {
    let sub = [];
    let v = { value: init, subscribe: (f) => sub.push(f) };

    return new Proxy(v, {
            get: function(target, name) {
                return target[name]
            },
            set: function(obj, prop, value) {
                if(prop == "value") {
                    obj[prop] = value

                    sub.forEach(f => f(value));
                }

                return true;
            }
        }
    );
}

const modals = [...document.querySelectorAll("[data-modal]")]
.reduce((prev, cur) => {
    const modalName = cur.getAttribute("data-modal")
    cur.addEventListener("click", (e) => { e.preventDefault(); hideModal(modalName) });
    cur.querySelector(".modal__content").addEventListener("click", (e) => e.stopPropagation());
    cur.querySelector(".modal__footer .btn").addEventListener("click", (e) => { e.preventDefault(); hideModal(modalName); modalController(modalName)});
    
    return {
        ...prev, 
        [modalName]: cur,
    }
}, {});


const openModalsBtns = document.querySelectorAll("[data-open-modal]").forEach(btn => {
    const modalName = btn.getAttribute("data-open-modal");

    btn.addEventListener("click", (e) => { e.preventDefault(); showModal(modalName) });
})

const modalsVisibilityStates = Observable({
    addStudent: false,
    deleteStudent: false,
    searchStudent: false
});

function updateModals (modalsStates) {
    if(modals.addStudent && modalsStates.addStudent) modals.addStudent.classList.remove("hidden");
    else if(modals.addStudent) modals.addStudent.classList.add("hidden");

    if(modals.deleteStudent && modalsStates.deleteStudent) modals.deleteStudent.classList.remove("hidden");
    else if(modals.deleteStudent) modals.deleteStudent.classList.add("hidden");

    if(modals.searchStudent && modalsStates.searchStudent) modals.searchStudent.classList.remove("hidden");
    else if(modals.deleteStudent) modals.searchStudent.classList.add("hidden");
}

modalsVisibilityStates.subscribe(updateModals);

function setModalState(modalName, state) {
    modalsVisibilityStates.value = {
        addStudent: modalName == "addStudent" ? state : modalsVisibilityStates.value.addStudent,
        deleteStudent: modalName == "deleteStudent" ? state : modalsVisibilityStates.value.deleteStudent,
        searchStudent: modalName == "searchStudent" ? state : modalsVisibilityStates.value.searchStudent
    };
}

function showModal(modalName) {
    setModalState(modalName, true);
}

function hideModal (modalName) {
    setModalState(modalName, false);
}

modalsVisibilityStates.value = {
    addStudent: false,
    deleteStudent: false,
    searchStudent: false
}

function createStudentCard(studentData) {
    const card = document.createElement("div");
    card.classList.add("card");

    const cardTitle = document.createElement("div");
    cardTitle.classList.add("card__title");
    cardTitle.textContent = `${studentData.surname} ${studentData.name} ${studentData.patronymic}, #${studentData.id}`;

    const cardFooter = document.createElement("div");
    cardFooter.classList.add("card__footer");

    const cardBtn = document.createElement("button");
    cardBtn.classList.add("btn");
    cardBtn.classList.add("btn-primary");
    cardBtn.textContent = "Удалить";
    cardFooter.appendChild(cardBtn);
    cardBtn.setAttribute("type", "button");
    cardBtn.addEventListener("click", (e) => { e.preventDefault(); deleteStudent({ id: studentData.id }) });

    const cardBody = document.createElement("div");
    cardBody.classList.add("card__body");

    studentData.rows.forEach(row => {
        const cardRow = document.createElement("div");
        cardRow.classList.add("card__row");

        const cardColName = document.createElement("div");
        const _cardColName = document.createElement("div");
        cardColName.classList.add("card__col");
        _cardColName.classList.add("col__name");
        _cardColName.textContent = row.name + ":";
        cardColName.appendChild(_cardColName);

        const cardColValue = document.createElement("div");
        const _cardColValue = document.createElement("div");
        cardColValue.classList.add("card__col");
        _cardColValue.classList.add("item");
        _cardColValue.textContent = row.value;
        cardColValue.appendChild(_cardColValue);

        cardRow.appendChild(cardColName);
        cardRow.appendChild(cardColValue);

        cardBody.appendChild(cardRow);
    });

    card.appendChild(cardTitle);
    card.appendChild(cardBody);
    card.appendChild(cardFooter);

    return card;
}

const studentListState = Observable([])

function transformStudentsData(response) {
    return {
        id: response.id,
        name: response.name,
        surname: response.surname,
        patronymic: response.patronymic,
        rows: [
            { name: "Имя", value: response.name, },
            { name: "Фамилия", value: response.surname, },
            { name: "Отчество", value: response.patronymic, },
            { name: "Дата рождения", value: response.birthday, },
            { name: "Группа", value: response.studentGroup, },
        ],
    };
}

function UpdateStudentList(studentList)
{
    const studentListNode = document.querySelector(".student-list");
    studentListNode.innerHTML = "";

    studentList.forEach(student => {
        const studentCard = createStudentCard(transformStudentsData(student));
        studentListNode.appendChild(studentCard);
    });    
}

studentListState.subscribe(UpdateStudentList);

function modalController(modalName) {
    const modal = modals[modalName];

    if(modalName === "searchStudent") {
        const searchData = { id: -1 };
        searchData.id = parseInt(modal.querySelector("input[name='id']").value);
        getStudent(searchData);
    }
    else if(modalName === "deleteStudent") {
        const deleteData = { id: -1 };
        deleteData.id = parseInt(modal.querySelector("input[name='id']").value);
        deleteStudent(deleteData);
    }
    else if(modalName === "addStudent") {
        const addData = { name: "", surname: "", patronymic: "", birthday: "", group: "" };

        if(modal.querySelector("input[name='name']")) addData.name = modal.querySelector("input[name='name']").value;
        if(modal.querySelector("input[name='surname']")) addData.surname = modal.querySelector("input[name='surname']").value;
        if(modal.querySelector("input[name='patronymic']")) addData.patronymic = modal.querySelector("input[name='patronymic']").value;
        if(modal.querySelector("input[name='birthday']")) addData.birthday = modal.querySelector("input[name='birthday']").value;
        if(modal.querySelector("input[name='group']")) addData.group = modal.querySelector("input[name='group']").value;

        addStudent(addData);
    }
}

function getStudents() {
    fetch(`${serverUrl}/student`)
        .then(response => response.json())
        .then(students => {
            studentListState.value = students;
        });
}

function deleteStudent(data) {
    if(data.id  < 0) return;

    fetch(`${serverUrl}/student/${data.id}`, {
        headers: {
            'Content-Type': 'application/json'
        },
        method: "POST"
    })
        .then(response => response.json())
        .then(d => {
            if(d.ok) getStudents();
            else alert("Ошибка при удалении студента");
        });
}

function getStudent(data) {
    if(data.id  < 0) return;

    fetch(`${serverUrl}/student/${data.id}`)
        .then(response => response.json())
        .then(students => {
            alert(JSON.stringify(students));
        });
}

function addStudent(data) {
    fetch(`${serverUrl}/student`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(d => {
            if(d.ok) getStudents();
            else alert(`Ошибка при добавлении студента [ ${d.error} ]`);
        });
}

getStudents();