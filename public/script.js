// 간단한 채팅/모달 제어 스크립트 (기존 ID와 호환)
const $ = (sel) => document.querySelector(sel);
const chatBox = $("#chat-box");
const userInput = $("#user-input");
const sendBtn = $("#send-button");
const loginBtn = $("#login-button");
const signupBtn = $("#signup-button");

const loginModal = $("#login-modal");
const signupModal = $("#signup-modal");
const closeLogin = $("#close-login");
const closeSignup = $("#close-signup");
const loginForm = $("#login-form");
const signupForm = $("#signup-form");

let currentSource = null; // 🔹 현재 열려있는 EventSource (중복 방지)

function openModal(modal) {
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
}
function closeModal(modal) {
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
}
function appendMsg(text, who = "bot") {
  const div = document.createElement("div");
  div.className = `msg ${who}`;
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
  return div;
}

function sendMessageStream() {
  const text = userInput.value.trim();
  if (!text) return;

  // 기존 스트림이 열려 있으면 종료 (중복 연결 방지)
  if (currentSource) {
    try {
      currentSource.close();
    } catch {}
    currentSource = null;
  }

  // 사용자 메시지 추가
  appendMsg(text, "user");
  userInput.value = "";

  // 봇 메시지 노드 준비
  const botNode = appendMsg("", "bot");

  // SSE 연결
  const url = `/chat/stream?prompt=${encodeURIComponent(text)}`;
  const source = new EventSource(url);
  currentSource = source;

  source.onmessage = (e) => {
    // 한 글자씩 누적
    botNode.textContent += e.data;
    chatBox.scrollTop = chatBox.scrollHeight;
  };

  source.addEventListener("done", () => {
    source.close();
    currentSource = null;
  });

  source.addEventListener("error", (e) => {
    // 서버에서 보낸 custom error(event: error)인 경우에는 data에 메시지가 들어있음
    let msg = "스트리밍 중 에러가 발생했습니다. 다시 시도해 주세요.";

    // MessageEvent 인 경우 data가 있을 수 있음
    if ("data" in e && e.data) {
      try {
        const parsed = JSON.parse(e.data);
        msg = `서버 오류: ${parsed}`;
      } catch {
        msg = `서버 오류: ${e.data}`;
      }
    }

    appendMsg(msg, "bot");

    try {
      source.close();
    } catch {}
    currentSource = null;
  });
}

// 전송 버튼을 스트리밍으로 연결
// (이전에 sendMessage를 쓰던 코드가 있었다면, 타입 체크로 안전 제거)
if (typeof sendMessage === "function") {
  sendBtn.removeEventListener("click", sendMessage);
}
sendBtn.addEventListener("click", sendMessageStream);

userInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessageStream();
  }
});

loginBtn.addEventListener("click", () => openModal(loginModal));
signupBtn.addEventListener("click", () => openModal(signupModal));
closeLogin.addEventListener("click", () => closeModal(loginModal));
closeSignup.addEventListener("click", () => closeModal(signupModal));

loginModal.addEventListener("click", (e) => {
  if (e.target === loginModal) closeModal(loginModal);
});
signupModal.addEventListener("click", (e) => {
  if (e.target === signupModal) closeModal(signupModal);
});
document.addEventListener("keyup", (e) => {
  if (e.key === "Escape") {
    closeModal(loginModal);
    closeModal(signupModal);
  }
});

// 폼 더미 핸들러(백엔드 연동 시 교체)
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  closeModal(loginModal);
  appendMsg("로그인 성공(더미).", "bot");
});
signupForm.addEventListener("submit", (e) => {
  e.preventDefault();
  closeModal(signupModal);
  appendMsg("회원 가입 완료(더미).", "bot");
});