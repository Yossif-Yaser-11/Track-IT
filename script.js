// قائمة أسماء المسؤولين عن الدعم الفني
const defaultTechnicians = [
    "يوسف ياسر",
    "محمد وليد",
    "رغدة علاء",
    "يوسف عمرو",
    "عمرو مليجي",
    "عمر طارق",
    "عبدالرحمن هلال",
    "اسلام سعيد",
    "احمد ماهر",
    "احمد خالد"
];

let technicians = JSON.parse(localStorage.getItem('technicians')) || defaultTechnicians;
let currentTechIndex = parseInt(localStorage.getItem('currentTechIndex')) || 0;
let tickets = JSON.parse(localStorage.getItem('tickets')) || [];

const ticketForm = document.getElementById('ticketForm');
const assignTypeSelect = document.getElementById('assignType');
const manualTechGroup = document.getElementById('manualTechGroup');
const filterDateInput = document.getElementById('filterDate');

// تعيين تاريخ اليوم افتراضياً في الفلتر
const todayStr = new Date().toISOString().split('T')[0];
filterDateInput.value = todayStr;

// إظهار/إخفاء اختيار المسؤول اليدوي
assignTypeSelect.addEventListener('change', function() {
    manualTechGroup.style.display = this.value === 'manual' ? 'block' : 'none';
});

// إضافة مسؤول عن الدعم الفني جديد للقائمة
function addTechnician() {
    const nameInput = document.getElementById('newTechName');
    const name = nameInput.value.trim();
    if (name) {
        technicians.push(name);
        nameInput.value = '';
        saveAndRender();
    }
}

// حذف مسؤول من القائمة
function removeTechnician(index) {
    technicians.splice(index, 1);
    if (currentTechIndex >= technicians.length) currentTechIndex = 0;
    saveAndRender();
}

// دالة التوزيع الآلي بالدور (Round-Robin)
function getNextTechnician() {
    if (technicians.length === 0) return "غير محدد";
    const tech = technicians[currentTechIndex];
    currentTechIndex = (currentTechIndex + 1) % technicians.length;
    localStorage.setItem('currentTechIndex', currentTechIndex);
    return tech;
}

// تسجيل عطل جديد
ticketForm.addEventListener('submit', function(e) {
    e.preventDefault();

    if (technicians.length === 0) {
        alert("يرجى إضافة مسؤول عن الدعم الفني واحد على الأقل أولاً!");
        return;
    }

    const assignType = assignTypeSelect.value;
    let assignedTech = "";

    if (assignType === 'auto') {
        assignedTech = getNextTechnician();
    } else {
        assignedTech = document.getElementById('manualTechSelect').value;
    }

    const now = new Date();
    const formattedDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const formattedTime = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const newTicket = {
        id: Date.now(),
        employeeName: document.getElementById('employeeName').value,
        location: document.getElementById('location').value,
        issueType: document.getElementById('issueType').value,
        description: document.getElementById('description').value,
        assignedTech: assignedTech,
        status: 'قيد التنفيذ',
        date: formattedDate,
        startTime: formattedTime,
        startTimestamp: now.getTime(),
        endTime: null,
        endTimestamp: null,
        durationMinutes: null
    };

    tickets.unshift(newTicket);
    filterDateInput.value = formattedDate; // التبديل لتاريخ العطل تلقائياً
    saveAndRender();
    ticketForm.reset();
    manualTechGroup.style.display = 'none';
});

// تعليم المهمة كمكتملة وتخزين وقت الانتهاء والمدة المستغرقة
function toggleTicketStatus(id, isChecked) {
    const now = new Date();
    
    tickets = tickets.map(t => {
        if (t.id === id) {
            if (isChecked) {
                t.status = 'تم الحل';
                t.endTime = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                t.endTimestamp = now.getTime();
                // حساب الفرق بالدقائق
                const diffMs = t.endTimestamp - t.startTimestamp;
                t.durationMinutes = Math.max(1, Math.round(diffMs / (1000 * 60))); 
            } else {
                t.status = 'قيد التنفيذ';
                t.endTime = null;
                t.endTimestamp = null;
                t.durationMinutes = null;
            }
        }
        return t;
    });
    saveAndRender();
}

// مسح كل السجلات
function clearAllData() {
    if (confirm("هل أنت تأكد من مسح جميع الأعطال المسجلة؟")) {
        tickets = [];
        saveAndRender();
    }
}

// حفظ البيانات وعرضها
function saveAndRender() {
    localStorage.setItem('technicians', JSON.stringify(technicians));
    localStorage.setItem('tickets', JSON.stringify(tickets));

    renderTechnicians();
    renderTickets();
}

// عرض قائمة المسؤولين عن الدعم الفني
function renderTechnicians() {
    const techList = document.getElementById('techList');
    const manualSelect = document.getElementById('manualTechSelect');
    
    techList.innerHTML = '';
    manualSelect.innerHTML = '';

    technicians.forEach((tech, index) => {
        techList.innerHTML += `
            <div class="tech-tag">
                ${tech}
                <span class="remove" onclick="removeTechnician(${index})">×</span>
            </div>
        `;
        manualSelect.innerHTML += `<option value="${tech}">${tech}</option>`;
    });
}

// عرض قائمة التذاكر المفلترة حسب اليوم المختار
function renderTickets() {
    const ticketsList = document.getElementById('ticketsList');
    const selectedDate = filterDateInput.value;
    
    ticketsList.innerHTML = '';

    // تصفية التذاكر بحسب اليوم المختار
    const filteredTickets = tickets.filter(t => t.date === selectedDate);

    // إحصائيات اليوم
    const totalCount = filteredTickets.length;
    const resolvedCount = filteredTickets.filter(t => t.status === 'تم الحل').length;
    const pendingCount = totalCount - resolvedCount;

    document.getElementById('statTotal').innerText = totalCount;
    document.getElementById('statPending').innerText = pendingCount;
    document.getElementById('statResolved').innerText = resolvedCount;

    if (filteredTickets.length === 0) {
        ticketsList.innerHTML = `<p style="text-align:center; color:#777; padding:20px;">لا يوجد أعطال مسجلة بتاريخ (${selectedDate}).</p>`;
        return;
    }

    filteredTickets.forEach(ticket => {
        const isResolved = ticket.status === 'تم الحل';
        
        let durationText = "";
        if (isResolved && ticket.durationMinutes !== null) {
            durationText = `<span class="duration-badge">⏱️ المستغرق: ${ticket.durationMinutes} دقيقة</span>`;
        }

        let endTimeText = ticket.endTime ? `<span class="time-badge">🏁 الانتهاء: ${ticket.endTime}</span>` : '<span class="time-badge">⏳ جارٍ العمل</span>';

        ticketsList.innerHTML += `
            <div class="ticket-card ${isResolved ? 'resolved' : ''}">
                <div class="ticket-header">
                    <span class="ticket-title">${ticket.employeeName} - [${ticket.location}]</span>
                    <span class="tech-name">المسؤول: ${ticket.assignedTech}</span>
                </div>
                <p><strong>نوع العطل:</strong> ${ticket.issueType} | <strong>الوصف:</strong> ${ticket.description}</p>
                
                <div style="margin-top: 8px; display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
                    <span class="time-badge">🕒 البداية: ${ticket.startTime}</span>
                    ${endTimeText}
                    ${durationText}
                </div>

                <div class="action-row">
                    <label class="check-container">
                        <input type="checkbox" ${isResolved ? 'checked' : ''} onchange="toggleTicketStatus(${ticket.id}, this.checked)">
                        <span>${isResolved ? 'تم إنهاء المهمة بنجاح' : 'تعليم كمكتملة (تم الحل)'}</span>
                    </label>
                </div>
            </div>
        `;
    });
}

// دالة تصدير شيت إكسيل (Excel Export) لليوم المختار
function exportToExcel() {
    const selectedDate = filterDateInput.value;
    const filteredTickets = tickets.filter(t => t.date === selectedDate);

    if (filteredTickets.length === 0) {
        alert(`لا توجد بيانات مسجلة لتاريخ ${selectedDate} لتصديرها!`);
        return;
    }

    // تجهيز مصفوفة البيانات بالشكل المنظم
    const excelData = filteredTickets.map((t, index) => ({
        "م": index + 1,
        "التاريخ": t.date,
        "اسم الموظف / القسم": t.employeeName,
        "المكان / الغرفة": t.location,
        "نوع العطل": t.issueType,
        "تفاصيل العطل": t.description,
        "المسؤول عن الدعم الفني": t.assignedTech,
        "وقت البلاغ (البداية)": t.startTime,
        "وقت الانتهاء": t.endTime || "لم ينتهِ بعد",
        "المدة المستغرقة (بالدقائق)": t.durationMinutes ? `${t.durationMinutes} دقيقة` : "-",
        "حالة المهمة": t.status
    }));

    // إنشاء شيت إكسيل باستخدام مكتبة SheetJS
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "تقرير الأعطال اليومي");

    // محاذاة وتنسيق الاتجاه للغة العربية RTL
    if(!worksheet['!views']) worksheet['!views'] = [];
    worksheet['!views'].push({RTL: true});

    // تحميل الملف فوراً باسم اليوم
    const fileName = `سجل_أعطال_IT_${selectedDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);
}

// التشغيل التلقائي عند فتح الصفحة
saveAndRender();