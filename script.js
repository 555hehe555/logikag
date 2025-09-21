let startScreen = document.querySelector('#start-screen');
let gameScreen = document.querySelector('#game-screen');

let startBtn = document.querySelector('#start-button');
let startText = document.querySelector('#start-text');

let x1 = document.querySelector('#x1');
let operatorElm = document.querySelector('#operator');
let x2 = document.querySelector('#x2');

let list_answers = document.querySelectorAll('.answer-button');
let taimerElm = document.querySelector('#timer');
let answerStatus = document.querySelector('#answer-text');
let history = document.querySelector('#history');

let correctAnswer = null; // Глобальна змінна для правильної відповіді

let startBtnClicked = false;

let allQuestions = 0
let correctQuestions = 0



async function queryLMStudio(systemPrompt, userMessage) {
    const url = "http://localhost:8080/api/v1/generate";

    const payload = {
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage }
        ],
        max_new_tokens: 100
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Відповідь моделі:", data);
        return data;

    } catch (error) {
        console.error("Помилка при зверненні до LM Studio:", error);
    }
}

// Виклик функції
queryLMStudio(
    "Ти асистент, який відповідає коротко і зрозуміло.",
    "Розкажи мені про JavaScript fetch API."
);




try{
  let prevHistory = getCookie('math_game_history') || '';
  history.innerHTML = 'Ваша історія:<br>' + prevHistory.split('\n').map(line => line.trim()).filter(Boolean).map(line => `&nbsp;&nbsp;${line}`).join('<br>');
}catch(e){
  console.log(e);
  history.innerHTML = `У вас ще немає історії`
}

startBtn.addEventListener('click', function() {
  startScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  startBtnClicked = true;
  startGame();
  taimer()
});

function randomNum(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateQuestion() {
  let num1 = randomNum(1, 100);
  let num2 = randomNum(1, 100);
  let operators = ['+', '-', '*', '/'];
  let operator = operators[randomNum(0, operators.length - 1)];

  console.log(num1, operator, num2);
  console.log(x1, operatorElm, x2);
  allQuestions++

  x1.innerHTML = num1;
  operatorElm.innerHTML = operator;
  x2.innerHTML = num2;
  let answer;
  switch(operator) {
    case '+':
      answer = num1 + num2;
      break;
    case '-':
      answer = num1 - num2;
      break;
    case '*':
      answer = num1 * num2;
      break;
    case '/':
      answer = +(num1 / num2).toFixed(2); // Ділення з округленням
      break;
  }
  return { answer };
}

function generateAnswers(correctAnswer) {
  // Визначаємо, чи відповідь дробова (ділення)
  const isFloat = String(correctAnswer).includes('.') && String(correctAnswer).length > 3;
  let answers = [isFloat ? Number(correctAnswer).toFixed(2) : correctAnswer];
  while (answers.length < list_answers.length) {
    let fake;
    let offset = randomNum(1, 10);
    if (Math.random() > 0.5) {
      fake = Number(correctAnswer) + offset;
    } else {
      fake = Number(correctAnswer) - offset;
    }
    fake = isFloat ? fake.toFixed(2) : fake;
    if (!answers.includes(fake)) {
      answers.push(fake);
    }
  }
  answers = answers.sort(() => Math.random() - 0.5);
  list_answers.forEach((btn, idx) => {
    btn.innerHTML = answers[idx];
  });
}


function clearAnswerListeners() {
  list_answers.forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.replaceWith(newBtn);
  });
  list_answers = document.querySelectorAll('.answer-button');
}

function setAnswerListeners() {
  list_answers.forEach(btn => {
    btn.addEventListener('click', function() {
      if (Number(btn.innerHTML) === correctAnswer) {
        answerStatus.innerHTML = 'Correct!';
        correctQuestions++;
        btn.classList.add('correct-anim');
      } else {
        answerStatus.innerHTML = `Wrong! The correct answer was ${correctAnswer}`;
        btn.classList.add('wrong-anim');
      }
      setTimeout(() => {
      list_answers.forEach(b => {
        b.classList.remove('correct-anim', 'wrong-anim');
      });
      startGame();
      }, 500);
    });
  });
}

function showResults() {
  let percent = allQuestions > 0 ? Math.round((correctQuestions / allQuestions) * 100) : 0;
  startText.innerHTML = `Game Over! You answered ${correctQuestions} out of ${allQuestions} questions correctly, ${percent}% correct answers.`;
  let date = new Date();
  let prevHistory = getCookie('math_game_history') || '';
  let newRecord = `${date.toLocaleString()}: ${correctQuestions}/${allQuestions}, ${percent}%`;
  let newHistory = prevHistory ? prevHistory + '\n' + newRecord : newRecord;
  setCookie('math_game_history', newHistory, 7*24*60*60);
  // Формуємо історію з відступами для HTML
  history.innerHTML = 'Ваша історія:<br>' + newHistory.split('\n').map(line => line.trim()).filter(Boolean).map(line => `&nbsp;&nbsp;${line}`).join('<br>');
  answerStatus.innerHTML = '';
  startScreen.style.display = 'block';
  gameScreen.style.display = 'none';
  correctQuestions = 0;
  allQuestions = 0;
  taimerElm.innerHTML = '10';
  startBtnClicked = false;
}

async function taimer() {
  for (let i = 10; i >= 0; i--) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    taimerElm.innerHTML = i;
    console.log(taimerElm.innerHTML);
  } 
  if (startBtnClicked != false) { 
    showResults()
  }
}

function startGame() {
  let q = generateQuestion();
  correctAnswer = q.answer;
  generateAnswers(correctAnswer);
  clearAnswerListeners();
  setAnswerListeners();
}

// --- Cookie helpers ---
function setCookie(name, value, seconds) {
  let expires = '';
  if (seconds) {
    let date = new Date();
    date.setTime(date.getTime() + (seconds * 1000));
    expires = '; expires=' + date.toUTCString();
  }
  document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/';
}

function getCookie(name) {
  let nameEQ = name + '=';
  let ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
  }
  return null;
}

