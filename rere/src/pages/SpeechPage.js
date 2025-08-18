// src/pages/SpeechPage.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { extractDestinationWithGemini } from '../utils/Gemini.js';

function SpeechPage() {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [statusText, setStatusText] = useState('도착지를 말하려면 원형을 클릭하세요');
  const [recognitionResult, setRecognitionResult] = useState('');
  const [destinationInput, setDestinationInput] = useState('');

  // 음성 인식 객체를 위한 state
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    // 1. 브라우저가 음성 인식을 지원하는지 확인합니다.
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatusText('이 브라우저는 음성 인식을 지원하지 않습니다.');
      return;
    }

    // 2. 음성 인식 객체를 설정하고 이벤트 핸들러를 정의합니다.
    const newRecognition = new SpeechRecognition();
    newRecognition.lang = 'ko-KR';
    newRecognition.interimResults = false;
    newRecognition.continuous = false;

    newRecognition.onstart = () => {
      setIsRecording(true);
      setStatusText('도착지를 말씀하세요...');
      setDestinationInput('');
      setRecognitionResult('');
    };

    newRecognition.onend = () => {
      setIsRecording(false);
      setStatusText('도착지를 말하려면 원형을 클릭하세요');
    };

    newRecognition.onerror = (event) => {
      console.error('음성 인식 오류:', event.error);
      setStatusText(`오류가 발생했습니다: ${event.error}`);
      setIsRecording(false);
    };

    newRecognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      
      setRecognitionResult(transcript);
      setStatusText('AI가 도착지를 분석 중입니다...');

      // Gemini API로 도착지 추출
      const destination = await extractDestinationWithGemini(transcript);
      
      if (destination) {
        setDestinationInput(destination);
        setStatusText('도착지 추출 완료!');
      } else {
        setDestinationInput('');
        setStatusText('인식된 문장에 도착지가 없습니다.');
      }
    };
    
    setRecognition(newRecognition);

    // 3. 컴포넌트가 unmount될 때 리스너를 정리합니다.
    return () => {
      if (newRecognition) {
        newRecognition.stop();
      }
    };
  }, []);

  const handleRecordButtonClick = () => {
    if (isRecording) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const handleSendButtonClick = () => {
    if (destinationInput.trim() !== '') {
      // 입력된 텍스트를 localStorage에 저장
      localStorage.setItem('userInputText', destinationInput);
      // ListPage로 이동
      navigate('/list');
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-6">
      <div className="flex flex-col items-center justify-center flex-1">
        <div 
          id="recordButton" 
          onClick={handleRecordButtonClick} 
          className={`relative w-32 h-32 mb-6 cursor-pointer ${isRecording ? 'recording animate-rotate' : ''}`}
        >
          {/* 원형 버튼 UI */}
          <div className={`outer-circle absolute inset-0 border-4 border-black rounded-full ${isRecording ? 'border-red-500' : ''}`}></div>
          <div className={`inner-circle absolute inset-0 m-3 bg-black rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : ''}`}></div>
        </div>
        
        <p className="text-xl font-medium text-center mb-8">{statusText}</p>
        
        <div className={`w-full max-w-md px-4 mb-8 ${recognitionResult ? '' : 'hidden'}`}>
          <p className="text-sm text-gray-500 mb-2">전체 인식 텍스트:</p>
          <div className="p-3 bg-gray-100 rounded-md min-h-16 text-center">{recognitionResult}</div>
        </div>

        <div className="w-full max-w-md px-4 mt-auto mb-20">
          <input
            type="text"
            className="w-full py-4 px-4 mb-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="추출된 도착지가 여기에 표시됩니다"
            value={destinationInput}
            onChange={(e) => setDestinationInput(e.target.value)}
          />
          <button
            onClick={handleSendButtonClick}
            className="w-full py-4 px-4 rounded-lg bg-blue-500 text-white font-bold text-2xl hover:bg-blue-700 transition duration-300 shadow-md"
            disabled={destinationInput.trim() === ''}
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
}

export default SpeechPage;