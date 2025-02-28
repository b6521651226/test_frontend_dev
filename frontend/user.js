const BASE_URL = 'http://localhost:8000';

window.onload = async () => {
    await loadData();  // เรียกฟังก์ชันนี้เพื่อโหลดข้อมูลตั้งแต่เริ่มต้นโดยไม่กรองอะไร
};

const applyFilters = async () => {
    const gender = document.getElementById('genderFilter').value;
    const sortOrder = document.getElementById('sortOrder').value;
    const searchTerm = document.getElementById('searchTerm').value;

    await loadData(gender, sortOrder, searchTerm);
};

const loadData = async (gender = 'all', sortOrder = 'id_asc', searchTerm = '') => {
    const response = await axios.get(`${BASE_URL}/users`);
    let users = response.data;

    // กรองข้อมูลตามเพศ
    users = filterData(users, gender);

    // เรียงข้อมูลตามที่เลือก หรือ เรียงตาม ID จากน้อยไปมากเริ่มต้น
    const [field, order] = sortOrder.split('_');
    users = sortData(users, field, order);

    // ค้นหาข้อมูลตามคำค้นหา
    users = searchData(users, searchTerm);

    const userDOM = document.getElementById('user');
    let htmlData = '';
    users.forEach((user, index) => {
        htmlData += `<div style="display: flex; justify-content: space-between;">
            <span>ลำดับ ${index + 1}: ชื่อ  ${user.firstname}  ${user.lastname} ID (${user.id})</span>
            
            <div>
                <a href='index.html?id=${user.id}'><button class='edit'>Edit</button></a>
                <button class='delete' data-id='${user.id}'>Delete</button>
            </div>
        </div>`;
    });
    userDOM.innerHTML = htmlData;

    // การจัดการปุ่ม delete
    const deleteDOMs = document.getElementsByClassName('delete');
    for (let i = 0; i < deleteDOMs.length; i++) {
        deleteDOMs[i].addEventListener('click', async (event) => {
            const id = event.target.dataset.id;
            const confirmDelete = confirm("Are you sure you want to delete this user?");
            if (confirmDelete) {
                try {
                    await axios.delete(`${BASE_URL}/users/${id}`);
                    alert("User deleted successfully!");
                    await loadData();
                } catch (error) {
                    console.log('Error:', error);
                }
            }
        });
    }
};

const toggleTable = () => {
    const tableContainer = document.getElementById('table-container');
    const userContainer = document.getElementById('user');
    
    if (tableContainer.style.display === 'none') {
        tableContainer.style.display = 'block';
        userContainer.style.display = 'none';
        loadTable();
    } else {
        tableContainer.style.display = 'none';
        userContainer.style.display = 'block';
    }
};

const loadTable = async () => {
    const response = await axios.get(`${BASE_URL}/users`);
    const users = response.data;

    const table = document.getElementById('dataTable');
    table.innerHTML = `<tr>
        <th>ลำดับ</th>
        <th>ชื่อ</th>
        <th>นามสกุล</th>
        <th>อายุ</th>
        <th>เพศ</th>
    </tr>`;

    users.forEach((user, index) => {
        table.innerHTML += `<tr>
            <td>${index + 1}</td>
            <td>${user.firstname}</td>
            <td>${user.lastname}</td>
            <td>${user.age}</td>
            <td>${user.gender}</td>
        </tr>`;
    });
};

const filterData = (data, gender) => {
    return data.filter(user => user.gender === gender || gender === 'all');
};

const sortData = (data, field, order = 'asc') => {
    return data.sort((a, b) => {
        if (a[field] < b[field]) return order === 'asc' ? -1 : 1;
        if (a[field] > b[field]) return order === 'asc' ? 1 : -1;
        return 0;
    });
};

const searchData = (data, searchTerm) => {
    return data.filter(user => 
        user.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastname.toLowerCase().includes(searchTerm.toLowerCase())
    );
};
