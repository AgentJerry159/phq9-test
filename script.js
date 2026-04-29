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
    // 1. 提交前必须检查最后一题是否作答
    const currentQuestion = questions[currentIndex];
    const currentInputs = currentQuestion.querySelectorAll('input[type="radio"]');
    let isAnswered = false;
    currentInputs.forEach(input => {
        if (input.checked) isAnswered = true;
    });

    if (!isAnswered) {
        alert("请先选择一个选项再生成数据！");
        return; 
    }

    // 2. 记录时间并提取所有表单数据
    recordTime(); 
    const form = document.getElementById('quiz-form');
    const formData = new FormData(form);
    
    const name = formData.get('userName');
    const gender = formData.get('userGender');
    const age = formData.get('userAge');
    const date = formData.get('testDate');

    let totalScore = 0;
    for (let i = 1; i <= 9; i++) {
        const val = formData.get(`q${i}`) || "0"; 
        totalScore += parseInt(val);
    }

    const totalTime = timeData.reduce((a, b) => a + b, 0).toFixed(1);

    // ==========================================
    // 3. 核心修改：调整数据顺序，完美避开官方库的 Bug
    // ==========================================
    
    // 【第一步】：先放绝对不会触发 Bug 的纯数字和英文字段
    let dataArray = [
        age, date, totalScore, totalTime, timeData[0].toFixed(1)
    ];

    // 继续推入 9 道题的纯数字得分和耗时
    for (let i = 1; i <= 9; i++) {
        dataArray.push(formData.get(`q${i}`) || "0");
        dataArray.push(timeData[i].toFixed(1));
    }

    // 【第二步】：将带有中文的字段严格“压轴”，放在数组最后！
    dataArray.push(gender);
    dataArray.push(name);

    // 拼接成一行紧凑的字符串，没有任何废话
    const compactData = dataArray.join(",");

    // 4. 界面切换：隐藏问卷表格，显示二维码容器
    form.style.display = 'none'; 
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
        <h3 style="color: #27ae60;">测评已完成！感谢您的配合。</h3>
        <p style="color: #666; font-size: 14px;">请协助工作人员拍摄或扫描下方二维码录入数据：</p>
        <div id="qrcode" style="display: flex; justify-content: center; margin-top: 30px; margin-bottom: 20px;"></div>
    `;

    // 5. 召唤二维码（由于已经避开了Bug，我们去掉了转码代码，直接输出原装中文）
    new QRCode(document.getElementById("qrcode"), {
        text: compactData,         
        width: 250,                
        height: 250,               
        colorDark : "#000000",     
        colorLight : "#ffffff",    
        correctLevel : QRCode.CorrectLevel.L // 最低容错，换取最大容量
    });
}
