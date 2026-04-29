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
    // 1. 提交前检查最后一题
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

    // 2. 记录时间并提取数据
    recordTime(); 
    const form = document.getElementById('quiz-form');
    const formData = new FormData(form);
    // === 窃听器：打印收集到的所有原始数据 ===
    for(let [key, value] of formData.entries()) {
        console.log(`抓取到 -> 题目: ${key}, 选项的值: ${value}`);
    }
    // ===================================
    
    const name = formData.get('userName');
    const gender = formData.get('userGender');
    const age = formData.get('userAge');
    const date = formData.get('testDate');

    let totalScore = 0;
    for (let i = 1; i <= 9; i++) {
        totalScore += parseInt(formData.get(`q${i}`) || "0"); 
    }

    const totalTime = timeData.reduce((a, b) => a + b, 0).toFixed(1);

    // ==========================================
    // 3. 构建“一目了然”的纵向排版内容
    // ==========================================
    let displayRows = [];
    displayRows.push(`【PHQ-9 测评报告】`);
    displayRows.push(`姓名：${name}`);
    displayRows.push(`性别：${gender}`);
    displayRows.push(`年龄：${age}`);
    displayRows.push(`日期：${date}`);
    displayRows.push(`总分：${totalScore}`);
    displayRows.push(`总耗时：${totalTime}秒`);
    displayRows.push(`基础信息耗时：${timeData[0].toFixed(1)}秒`);
    displayRows.push(`----------------`);

    for (let i = 1; i <= 9; i++) {
        const val = formData.get(`q${i}`) || "0";
        displayRows.push(`Q${i}得分：${val} (用时:${timeData[i].toFixed(1)}s)`);
    }

    // 使用换行符连接，形成纵向文本
    const readableData = displayRows.join("\n");

    // 4. 界面切换
    form.style.display = 'none'; 
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
        <h3 style="color: #27ae60;">测评已完成！</h3>
        <p style="color: #666; font-size: 14px;">请扫描下方二维码核对并录入数据：</p>
        <div style="display: flex; justify-content: center; margin-top: 20px; margin-bottom: 20px;">
            <canvas id="qrcode-canvas"></canvas>
        </div>
        <button type="button" onclick="location.reload()" style="background-color: #95a5a6; width: auto; padding: 10px 20px; margin: 0 auto; display: block;">返回重新填写</button>
    `;

    // 5. 渲染高清二维码
    // 这个库会自动处理中文编码，无需额外转码
    QRCode.toCanvas(document.getElementById('qrcode-canvas'), readableData, {
        width: 280,
        margin: 2,
        errorCorrectionLevel: 'M' // 提高到中等容错，让二维码更健壮
    }, function (error) {
        if (error) {
            console.error(error);
            alert("二维码生成失败，请检查控制台报错。");
        }
    });
}
