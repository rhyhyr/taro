  import { extractDestinationWithGemini } from '/Gemini.js';

  // DOM 요소
  const recordButton = document.getElementById('recordButton');
  const recognitionStatus = document.getElementById('recognitionStatus');
  const resultContainer = document.getElementById('resultContainer');
  const recognitionResult = document.getElementById('recognitionResult');
  const messageInput = document.getElementById('messageInput');
  
  // 음성 인식 객체 설정
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition;
  let isRecording = false;

  if (!SpeechRecognition) {
    recognitionStatus.textContent = "이 브라우저는 음성 인식을 지원하지 않습니다.";
  } 
  else {
    recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.interimResults = false;
    recognition.continuous = false;

    recordButton.addEventListener('click', () => isRecording ? recognition.stop() : recognition.start());

    recognition.onstart = () => {
      isRecording = true;
      recordButton.classList.add('recording', 'animate-rotate');
      recordButton.querySelector('.inner-circle').classList.add('animate-pulse');
      recognitionStatus.textContent = "도착지를 말씀하세요...";
      messageInput.value = '';
      messageInput.placeholder = '음성 인식 중...';
    };

    recognition.onend = () => {
      isRecording = false;
      recordButton.classList.remove('recording', 'animate-rotate');
      recordButton.querySelector('.inner-circle').classList.remove('animate-pulse');
      recognitionStatus.textContent = "도착지를 말하려면 원형을 클릭하세요";
      messageInput.placeholder = '추출된 도착지가 여기에 표시됩니다';
    };

    recognition.onerror = (event) => {
      console.error("음성 인식 오류:", event.error);
      recognitionStatus.textContent = "오류가 발생했습니다: " + event.error;
    };

    // 음성 인식 결과 처리 (가장 중요한 부분)
    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      
      // 전체 인식 결과 보여주기
      recognitionResult.textContent = transcript;
      resultContainer.classList.remove('hidden');
      recognitionStatus.textContent = 'AI가 도착지를 분석 중입니다...';

      // Gemini API로 도착지 추출
      const destination = await extractDestinationWithGemini(transcript);
      
      if (destination) {
        messageInput.value = destination; // 추출된 도착지를 입력창에 표시
        recognitionStatus.textContent = '도착지 추출 완료!';
      } else {
        messageInput.value = ''; // 도착지가 없으면 비워둠
        recognitionStatus.textContent = '인식된 문장에 도착지가 없습니다.';
      }
    };
  }
  
  // 전송 버튼 클릭 이벤트
  sendButton.addEventListener('click', () => {
    if (messageInput.value.trim() !== '') {
      // 입력된 텍스트를 localStorage에 저장
      localStorage.setItem('userInputText', messageInput.value);
      
      // 확인 페이지로 이동
      window.location.href = `/list`;
    }
  });
  
  // 엔터 키 이벤트
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && messageInput.value.trim() !== '') {
      sendButton.click();
    }
  });
