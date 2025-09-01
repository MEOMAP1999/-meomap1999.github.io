(function(){
  const LS = { users:'lspd_users', duty:'lspd_duty', me:'lspd_me', reset:'lspd_reset' };
  const store = {
    get:(k,d=[]) => JSON.parse(localStorage.getItem(k) || JSON.stringify(d)),
    set:(k,v) => localStorage.setItem(k, JSON.stringify(v)),
    clear:()=>localStorage.clear()
  };
  // Reset dữ liệu lần đầu
  function resetData(){
    if(!localStorage.getItem(LS.reset)){
      localStorage.clear();
      localStorage.setItem(LS.reset,'1');
    }
  }
  resetData();
  // Tạo admin mặc định
  function ensureAdmin(){
    let users = store.get(LS.users, []);
    if(!users.find(u=>u.username==='admin')){
      users.push({
        id:Date.now(),
        username:'admin',
        password:'159753',
        name:'Administrator',
        role:'Admin',
        position:'Cục trưởng',
        rank:'Trung Tá',
        rate:50,
        career:0
      });
      store.set(LS.users, users);
    }
  }
  ensureAdmin();
  document.addEventListener('DOMContentLoaded', ()=>{
    const currentUser = store.get(LS.me, null);
    // Nếu chưa login mà không phải trang index -> quay về login
    if(!currentUser && !document.getElementById('loginForm')){
      location.href = "index.html";
      return;
    }
    // ---------------- Login ----------------
    if(document.getElementById('loginForm')){
      document.getElementById('loginForm').addEventListener('submit', e=>{
        e.preventDefault();
        const u=document.getElementById('username').value.trim();
        const p=document.getElementById('password').value.trim();
        const users=store.get(LS.users,[]);
        const me=users.find(x=>x.username===u && x.password===p);
        if(me){
          store.set(LS.me,me);
          location.href='dashboard.html';
        } else {
          alert('Sai tài khoản hoặc mật khẩu');
        }
      });
    }

    // ---------------- Duty ----------------
    if(document.getElementById('btnOn')){
      renderDuty(); renderMonth();

      document.getElementById('btnOn').addEventListener('click', ()=>{
        const me=store.get(LS.me,{});
        if(!me.id) return alert('Bạn chưa đăng nhập');
        const duty=store.get(LS.duty,[]);
        if(duty.find(d=>d.userId==me.id && !d.end)) return alert('Bạn đã On-duty rồi');
        duty.push({
          id:Date.now(),
          userId:me.id,
          name:me.name,
          start:Date.now(),
          end:null,
          hours:0,
          salary:0
        });
        store.set(LS.duty,duty);
        renderDuty();
      });

      document.getElementById('btnOff').addEventListener('click', ()=>{
        const me=store.get(LS.me,{});
        if(!me.id) return alert('Bạn chưa đăng nhập');
        const duty=store.get(LS.duty,[]);
        const current=duty.find(d=>d.userId==me.id && !d.end);
        if(!current) return alert('Bạn chưa On-duty');
        current.end=Date.now();
        current.hours=+((current.end-current.start)/36e5).toFixed(2);
        current.salary=current.hours*me.rate;

        // Cập nhật tổng sự nghiệp
        me.career=(me.career||0)+current.salary;
        let users=store.get(LS.users,[]);
        let idx=users.findIndex(u=>u.id==me.id);
        if(idx>=0) users[idx]=me;
        store.set(LS.users,users);
        store.set(LS.me,me);
        store.set(LS.duty,duty);

        renderDuty(); renderMonth();
      });
    }

    // ---------------- Manage ----------------
    if(document.getElementById('addUserForm')){
      renderUsers();

      document.getElementById('addUserForm').addEventListener('submit', e=>{
        e.preventDefault();
        let users = store.get(LS.users, []);
        const newUser = {
          id: Date.now(),
          username: document.getElementById('username').value.trim(),
          password: document.getElementById('password').value.trim(),
          name: document.getElementById('name').value.trim(),
          role: document.getElementById('role').value,
          position: document.getElementById('position').value,
          rank: document.getElementById('rank').value,
          rate: parseInt(document.getElementById('rate').value)||50,
          career: 0
        };

        // kiểm tra trùng username
        if(users.find(u=>u.username===newUser.username)){
          alert("Tên đăng nhập đã tồn tại!");
          return;
        }

        users.push(newUser);
        store.set(LS.users, users);
        renderUsers();
        e.target.reset();
      });
    }

    // ---------------- Dashboard ----------------
    if(document.getElementById('welcomeName')){
      const me=store.get(LS.me,{});
      document.getElementById('welcomeName').textContent=me.name||me.username||'';
    }
    // ---------------- Logout ----------------
    if(document.getElementById('btnLogout')){
      document.getElementById('btnLogout').addEventListener('click', e=>{
        e.preventDefault();
        localStorage.removeItem(LS.me);
        location.href = "index.html";
      });
    }
  });
  // ==== Helper functions ====
  function renderUsers(){
    const tbody = document.querySelector('#usersTbl tbody');
    if(!tbody) return;
    const users = store.get(LS.nhânviên, []);
    const me = store.get(LS.me, {}); // lấy người đang đăng nhập
    tbody.innerHTML = users.map((u,i)=>{
      // Nếu nhân viên hiện tại không phải quản trị viên -> không hiển thị nút Sửa/Xóa
      let actionBtns = "";
      if(me.role === "quản trị viên"){
        actionBtns = `
          <button class="btn btn-sm btn-warning" onclick="editUser(${u.id})">✏️ Sửa</button>
          <button class="btn btn-sm btn-danger" onclick="deleteUser(${u.id})">❌ Xóa</button>
        `;
      }
      return `
        <tr>
          <td>${i+1}</td>
          <td>${u.username}</td>
          <td>${u.name}</td>
          <td>${u.role}</td>
          <td>${u.position}</td>
          <td>${u.rank}</td>
          <td>${u.rate}$</td>
          <td>${actionBtns}</td>
        </tr>`;
    }).join('');
  }
  // Chỉ quản trị viên mới sửa được
  window.editUser=function(id){
    const me=store.get(LS.me,{});
    if(me.role!=="quản trị viên") return alert("Bạn không có quyền sửa");
    let users=store.get(LS.users,[]);
    let u=users.find(x=>x.id==id); if(!u) return;
    u.username=prompt('Tên đăng nhập:',u.username)||u.username;
    u.password=prompt('Mật khẩu:',u.password)||u.password;
    u.name=prompt('Tên sĩ quan:',u.name)||u.name;
    u.role=prompt('Vai trò (Admin/User):',u.role)||u.role;
    u.position=prompt('Chức vụ:',u.position)||u.position;
    u.rank=prompt('Quân hàm:',u.rank)||u.rank;
    u.rate=parseInt(prompt('Lương/giờ:',u.rate)||u.rate);
    store.set(LS.users,users);
    renderUsers();
  };

  // Chỉ quản trị viên mới xóa được
  window.deleteUser=function(id){
    const me=store.get(LS.me,{});
    if(me.role!=="quản trị viên") return alert("Bạn không có quyền xóa");
    if(confirm('Xóa nhân sự này?')){
      let users=store.get(LS.users,[]).filter(x=>x.id!=id);
      store.set(LS.users,users);
      renderUsers();
    }
  };

  function renderDuty(){
    const tbody=document.querySelector('#dutyTbl tbody'); if(!tbody) return;
    const me=store.get(LS.me,{});
    const duty=store.get(LS.duty,[]).filter(d=>d.userId==me.id);
    tbody.innerHTML=duty.map(d=>{
      let minutes = d.hours ? Math.round(d.hours * 60) : 0;
      return `
        <tr>
          <td>${new Date(d.start).toLocaleDateString()}</td>
          <td>${new Date(d.start).toLocaleTimeString()}</td>
          <td>${d.end? new Date(d.end).toLocaleTimeString():''}</td>
          <td>${d.hours||0}</td>
          <td>${minutes}</td>
          <td>${d.salary||0}$</td>
          <td style="color:${d.end?'green':'red'}">${d.end?'Hoàn thành':'Đang On-duty'}</td>
        </tr>`;
    }).join('');
  }

  function renderMonth(){
    const tbl=document.querySelector('#monthTbl tbody'); if(!tbl) return;
    const me=store.get(LS.me,{});
    const duty=store.get(LS.duty,[]).filter(d=>d.userId==me.id);
    let summary={};
    duty.forEach(d=>{
      if(!d.end) return;
      let key=new Date(d.start).getMonth()+1+'/'+new Date(d.start).getFullYear();
      if(!summary[key]) summary[key]={hours:0,minutes:0,salary:0};
      summary[key].hours+=d.hours;
      summary[key].minutes+=Math.round(d.hours*60);
      summary[key].salary+=d.salary;
    });
    tbl.innerHTML=Object.keys(summary).map(k=>
      `<tr>
        <td>${k}</td>
        <td>${summary[k].hours.toFixed(2)}h</td>
        <td>${summary[k].minutes} phút</td>
        <td>${summary[k].salary}$</td>
      </tr>`
    ).join('');
  }

// ===== Xuất Excel =====
if(document.getElementById('btnExport')){
  document.getElementById('btnExport').addEventListener('click', ()=>{
    let table1 = document.getElementById("dutyTbl");
    let table2 = document.getElementById("monthTbl");
    let ws1 = XLSX.utils.table_to_sheet(table1);
    let ws2 = XLSX.utils.table_to_sheet(table2);
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, "ChamCong");
    XLSX.utils.book_append_sheet(wb, ws2, "TongKetThang");
    XLSX.writeFile(wb, "ChamCong.xlsx");
  });
}
// thay đổi màu chữ
// (Removed duplicate LS and store declarations, and duplicate resetData and ensureAdmin functions)

  document.addEventListener('DOMContentLoaded', ()=>{
    const currentUser = store.get(LS.me, null);

    // Nếu chưa login mà không phải trang index -> quay về login
    if(!currentUser && !document.getElementById('loginForm')){
      location.href = "index.html";
      return;
    }

    // ---------------- Login ----------------
    if(document.getElementById('loginForm')){
      document.getElementById('loginForm').addEventListener('submit', e=>{
        e.preventDefault();
        const u=document.getElementById('username').value.trim();
        const p=document.getElementById('password').value.trim();
        const users=store.get(LS.users,[]);
        const me=users.find(x=>x.username===u && x.password===p);
        if(me){
          store.set(LS.me,me);
          location.href='dashboard.html';
        } else {
          alert('Sai tài khoản hoặc mật khẩu');
        }
      });
    }

    // ---------------- Duty ----------------
    if(document.getElementById('btnOn')){
      renderDuty(); renderMonth();

      document.getElementById('btnOn').addEventListener('click', ()=>{
        const me=store.get(LS.me,{});
        if(!me.id) return alert('Bạn chưa đăng nhập');
        const duty=store.get(LS.duty,[]);
        if(duty.find(d=>d.userId==me.id && !d.end)) return alert('Bạn đã On-duty rồi');
        duty.push({
          id:Date.now(),
          userId:me.id,
          name:me.name,
          start:Date.now(),
          end:null,
          hours:0,
          salary:0
        });
        store.set(LS.duty,duty);
        function renderDuty(){
  const tbody=document.querySelector('#dutyTbl tbody'); if(!tbody) return;
  const me=store.get(LS.me,{});
  const duty=store.get(LS.duty,[]).filter(d=>d.userId==me.id);
  tbody.innerHTML=duty.map(d=>{
    let minutes = d.hours ? Math.round(d.hours * 60) : 0; // tính phút
    return `
      <tr>
        <td>${new Date(d.start).toLocaleDateString()}</td>
        <td>${new Date(d.start).toLocaleTimeString()}</td>
        <td>${d.end? new Date(d.end).toLocaleTimeString():''}</td>
        <td>${d.hours||0}</td>
        <td>${minutes}</td>
        <td>${d.salary||0}$</td>
        <td style="color:${d.end?'green':'red'}">${d.end?'Hoàn thành':'Đang On-duty'}</td>
      </tr>`;
  }).join('');
}

function renderMonth(){
  const tbl=document.querySelector('#monthTbl tbody'); if(!tbl) return;
  const me=store.get(LS.me,{});
  const duty=store.get(LS.duty,[]).filter(d=>d.userId==me.id);
  let summary={};
  duty.forEach(d=>{
    if(!d.end) return;
    let key=new Date(d.start).getMonth()+1+'/'+new Date(d.start).getFullYear();
    if(!summary[key]) summary[key]={hours:0,minutes:0,salary:0};
    summary[key].hours+=d.hours;
    summary[key].minutes+=Math.round(d.hours*60);
    summary[key].salary+=d.salary;
  });
  tbl.innerHTML=Object.keys(summary).map(k=>
    `<tr>
      <td>${k}</td>
      <td>${summary[k].hours.toFixed(2)}h</td>
      <td>${summary[k].minutes} phút</td>
      <td>${summary[k].salary}$</td>
    </tr>`
  ).join('');
}
        store.set(LS.duty,duty);
      });

      document.getElementById('btnOff').addEventListener('click', ()=>{
        const me=store.get(LS.me,{});
        if(!me.id) return alert('Bạn chưa đăng nhập');
        const duty=store.get(LS.duty,[]);
        const current=duty.find(d=>d.userId==me.id && !d.end);
        if(!current) return alert('Bạn chưa On-duty');
        current.end=Date.now();
        current.hours=+((current.end-current.start)/36e5).toFixed(2);
        current.salary=current.hours*me.rate;

        // Cập nhật tổng sự nghiệp
        me.career=(me.career||0)+current.salary;
        let users=store.get(LS.users,[]);
        let idx=users.findIndex(u=>u.id==me.id);
        if(idx>=0) users[idx]=me;
        store.set(LS.users,users);
        store.set(LS.me,me);
        store.set(LS.duty,duty);

        renderDuty(); renderMonth();
      });
    }

    // ---------------- Manage ----------------
    if(document.getElementById('addUserForm')){
      renderUsers();

      document.getElementById('addUserForm').addEventListener('submit', e=>{
        e.preventDefault();
        let users = store.get(LS.users, []);
        const newUser = {
          id: Date.now(),
          username: document.getElementById('username').value.trim(),
          password: document.getElementById('password').value.trim(),
          name: document.getElementById('name').value.trim(),
          role: document.getElementById('role').value,
          position: document.getElementById('position').value,
          rank: document.getElementById('rank').value,
          rate: parseInt(document.getElementById('rate').value)||50,
          career: 0
        };

        // kiểm tra trùng username
        if(users.find(u=>u.username===newUser.username)){
          alert("Tên đăng nhập đã tồn tại!");
          return;
        }

        users.push(newUser);
        store.set(LS.users, users);
        renderUsers();
        e.target.reset();
      });
    }

    // ---------------- Dashboard ----------------
    if(document.getElementById('welcomeName')){
      const me=store.get(LS.me,{});
      document.getElementById('welcomeName').textContent=me.name||me.username||'';
    }

    // ---------------- Logout ----------------
    if(document.getElementById('btnLogout')){
      document.getElementById('btnLogout').addEventListener('click', e=>{
        e.preventDefault();
        localStorage.removeItem(LS.me);
        location.href = "index.html";
      });
    }
  });

  // ==== Helper functions ====
  function renderUsers(){
  const tbody = document.querySelector('#usersTbl tbody');
  if(!tbody) return;
  const users = store.get(LS.users, []);
  const me = store.get(LS.me, {}); // lấy người đang đăng nhập

  tbody.innerHTML = users.map((u,i)=>{
    // Nếu user hiện tại không phải Admin -> không hiển thị nút Sửa/Xóa
    let actionBtns = "";
    if(me.role === "Admin"){
      actionBtns = `
        <button class="btn btn-sm btn-warning" onclick="editUser(${u.id})">✏️ Sửa</button>
        <button class="btn btn-sm btn-danger" onclick="deleteUser(${u.id})">❌ Xóa</button>
      `;
    }
    return `
      <tr>
        <td>${i+1}</td>
        <td>${u.username}</td>
        <td>${u.name}</td>
        <td>${u.role}</td>
        <td>${u.position}</td>
        <td>${u.rank}</td>
        <td>${u.rate}$</td>
        <td>${actionBtns}</td>
      </tr>`;
  }).join('');
}

    window.editUser=function(id){
      let users=store.get(LS.users,[]);
      let u=users.find(x=>x.id==id); if(!u) return;
      u.username=prompt('Tên đăng nhập:',u.username)||u.username;
      u.password=prompt('Mật khẩu:',u.password)||u.password;
      u.name=prompt('Tên sĩ quan:',u.name)||u.name;
      u.role=prompt('Vai trò (Admin/User):',u.role)||u.role;
      u.position=prompt('Chức vụ:',u.position)||u.position;
      u.rank=prompt('Quân hàm:',u.rank)||u.rank;
      u.rate=parseInt(prompt('Lương/giờ:',u.rate)||u.rate);
      store.set(LS.users,users);
      renderUsers();
    };

    window.deleteUser=function(id){
      if(confirm('Xóa nhân sự này?')){
        let users=store.get(LS.users,[]).filter(x=>x.id!=id);
        store.set(LS.users,users);
        renderUsers();
      }
    };
  // Remove the extra closing brace above to fix the syntax error

  function renderDuty(){
    const tbody=document.querySelector('#dutyTbl tbody'); if(!tbody) return;
    const me=store.get(LS.me,{});
    const duty=store.get(LS.duty,[]).filter(d=>d.userId==me.id);
    tbody.innerHTML=duty.map(d=>`
      <tr>
        <td>${new Date(d.start).toLocaleDateString()}</td>
        <td>${new Date(d.start).toLocaleTimeString()}</td>
        <td>${d.end? new Date(d.end).toLocaleTimeString():''}</td>
        <td>${d.hours||0}</td>
        <td>${d.salary||0}$</td>
        <td style="color:${d.end?'green':'red'}">${d.end?'Hoàn thành':'Đang On-duty'}</td>
      </tr>`).join('');
  }

  function renderMonth(){
    const tbl=document.querySelector('#monthTbl tbody'); if(!tbl) return;
    const me=store.get(LS.me,{});
    const duty=store.get(LS.duty,[]).filter(d=>d.userId==me.id);
    let summary={};
    duty.forEach(d=>{
      if(!d.end) return;
      let key=new Date(d.start).getMonth()+1+'/'+new Date(d.start).getFullYear();
      if(!summary[key]) summary[key]={hours:0,salary:0};
      summary[key].hours+=d.hours;
      summary[key].salary+=d.salary;
    });
    tbl.innerHTML=Object.keys(summary).map(k=>
      `<tr><td>${k}</td><td>${summary[k].hours.toFixed(2)}h</td><td>${summary[k].salary}$</td></tr>`
    ).join('');

    if(document.getElementById('monthLabel'))
      document.getElementById('monthLabel').textContent=new Date().getMonth()+1;
    if(document.getElementById('monthSalary'))
      document.getElementById('monthSalary').textContent=
        (Object.values(summary).reduce((a,b)=>a+b.salary,0))+'$';
    if(me.role) document.getElementById('role').textContent=me.role;
    if(me.rate) document.getElementById('rate').textContent=me.rate;
    if(me.career) document.getElementById('careerSalary').textContent=me.career+'$';
  }
})();

// ===== Xuất Excel =====
if(document.getElementById('btnExport')){
  document.getElementById('btnExport').addEventListener('click', ()=>{
    let table1 = document.getElementById("dutyTbl");
    let table2 = document.getElementById("monthTbl");

    // Sheet 1: Bảng chấm công
    let ws1 = XLSX.utils.table_to_sheet(table1);

    // Sheet 2: Bảng tổng kết tháng
    let ws2 = XLSX.utils.table_to_sheet(table2);

    // Tạo file Excel có 2 sheet
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, "ChamCong");
    XLSX.utils.book_append_sheet(wb, ws2, "TongKetThang");

    // Xuất file
    XLSX.writeFile(wb, "ChamCong.xlsx");
  });
}

// thay đổi màu chữ
function changeTextColor(color) {
  document.querySelectorAll('.rainbow-text').forEach(el => {
    el.style.color = color;
  });
}    const colors = ["red", "orange", "yellow", "green", "blue", "indigo", "violet"];
    const textElement = document.getElementById("myText"); // Lấy phần tử văn bản
    textElement.innerHTML = '<h1 class="rainbow-text">Đây là chữ 7 màu</h1>';
    let currentColorIndex = 0;

    setInterval(() => {
      changeTextColor(colors[currentColorIndex]);
      currentColorIndex = (currentColorIndex + 1) % colors.length;
    }, 1000);    // Thay đổi màu mỗi 1 giây
    setInterval(() => {
      changeTextColor(colors[currentColorIndex]);
      currentColorIndex = (currentColorIndex + 1) % colors.length;
    }, 300);