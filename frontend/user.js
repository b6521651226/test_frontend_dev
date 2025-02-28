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
    let htmlData = '<div>';
    users.forEach(user => {
        htmlData += `<div>
            <span class='userss'>${user.id} ${user.firstname} ${user.lastname}</span>
            <a href='index.html?id=${user.id}'><button class='edit'>Edit</button></a>
            <button class='delete' data-id='${user.id}'>Delete</button>
        </div>`;
    });
    htmlData += '</div>';
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
