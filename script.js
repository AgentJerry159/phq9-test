let currentIndex = 0;
let questions = [];

// 新增计时相关变量
let pageStartTime = 0; // 记录进入当前页面的时间戳
// 存放每页用时（索引0是基础信息页，索引1-9是9道题目）
let timeData = new Array(10).fill(0); 

window.onload = function() {
    questions = document.querySelectorAll('.question');
    if (questions.length > 0) {
        questions[0].classList.add('active');
    }
    
    const today = new Date().toISOString().split('T')[0];
    document.querySelector('input[name="testDate"]').value = today;

    // 页面加载完毕，开始计算第一页（基础信息）的用时
    pageStartTime = Date.now();
};

function updateButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');

    prevBtn.style.display = (currentIndex === 0) ? 'none' : 'block';

    if (currentIndex === questions.length - 1) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'block';
    } else {
        nextBtn.style.display = 'block';
        submitBtn.style.display = 'none';
    }
}

// 新增功能：计算并记录当前页面的停留时间
function recordTime() {
    const now = Date.now();
    const spentTime = (now - pageStartTime) / 1000; // 转换为秒
    // 使用累加，防止受试者点击“上一页”退回修改时丢失之前思考的时间
    timeData[currentIndex] += spentTime; 
    pageStartTime = now; // 重置计时器，为下一页做准备
}

function nextQuestion() {
    const currentQuestion = questions[currentIndex];
    
    if (currentIndex === 0) {
        const name = currentQuestion.querySelector('input[name="userName"]').value;
        const age = currentQuestion.querySelector('input[name="userAge"]').value;
        const genderChecked = currentQuestion.querySelector('input[name="userGender"]:checked');
        
        if (!name || !age || !genderChecked) {
            alert("请填写完整的基本信息！");
            return;
        }
    } else {
        const currentInputs = currentQuestion.querySelectorAll('input[type="radio"]');
        let isAnswered = false;
        currentInputs.forEach(input => {
            if (input.checked) isAnswered = true;
        });

        if (!isAnswered) {
            alert("请先选择一个选项！");
            return;
        }
    }

    recordTime(); // 离开当前页前，记录时间

    questions[currentIndex].classList.remove('active');
    currentIndex++;
    questions[currentIndex].classList.add('active');
    updateButtons();
}

function prevQuestion() {
    recordTime(); // 离开当前页前，记录时间

    questions[currentIndex].classList.remove('active');
    currentIndex--;
    questions[currentIndex].classList.add('active');
    updateButtons();
}

function calculateAndSave() {
    // ======== 第一层保险：提交前必须检查最后一题是否作答 ========
    const currentQuestion = questions[currentIndex];
    const currentInputs = currentQuestion.querySelectorAll('input[type="radio"]');
    let isAnswered = false;
    currentInputs.forEach(input => {
        if (input.checked) isAnswered = true;
    });

    if (!isAnswered) {
        alert("请先选择一个选项再提交！");
        return; // 发现没答，直接拦截，不执行后续保存逻辑
    }
    // =========================================================

    recordTime(); // 记录最后一题的完成时间

    const form = document.getElementById('quiz-form');
    const formData = new FormData(form);
    
    const name = formData.get('userName');
    const gender = formData.get('userGender');
    const age = formData.get('userAge');
    const date = formData.get('testDate');

    let totalScore = 0;
    
    // ======== 第二层保险：计算总分时，把 null 强制转为 0 ========
    for (let i = 1; i <= 9; i++) {
        // 逻辑运算 || 的意思是：如果左边取不到值(null)，就用右边的 "0"
        const val = formData.get(`q${i}`) || "0"; 
        totalScore += parseInt(val);
    }

    // 计算总用时
    const totalTime = timeData.reduce((a, b) => a + b, 0).toFixed(1);

    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `<h3>${name}，测评已完成！</h3>`;

    let csvRows = [];
    csvRows.push("测试项目,具体数值");
    csvRows.push(`姓名,${name}`);
    csvRows.push(`性别,${gender}`);
    csvRows.push(`年龄,${age}`);
    csvRows.push(`填写日期,${date}`);
    csvRows.push(`总分,${totalScore}`);
    csvRows.push(`总答题用时(秒),${totalTime}`);
    csvRows.push(`基础信息填写用时(秒),${timeData[0].toFixed(1)}`);

    for (let i = 1; i <= 9; i++) {
        // 这里提取具体每一题数据时，同样把 null 强制转为 "0"
        const val = formData.get(`q${i}`) || "0";
        csvRows.push(`Q${i}得分,${val}`);
        csvRows.push(`Q${i}用时(秒),${timeData[i].toFixed(1)}`);
    }

    const csvContent = csvRows.join("\n");

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `PHQ9_${name}_${date}.csv`; 
    a.click();
    
    URL.revokeObjectURL(url);
}