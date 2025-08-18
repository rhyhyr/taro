import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
    const navigate = useNavigate();
    const [isListening, setIsListening] = useState(false);
    const [recognitionStatus, setRecognitionStatus] = useState("도착지를 말하려면 원형을 클릭하세요");
    const [recognitionResult, setRecognitionResult] = useState(""); // 전체 인식 텍스트 상태 추가
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [messageInput, setMessageInput] = useState("");

    // API 키를 직접 포함
    const Tmap = "z1X5bjuncu1DaI5iBjpsr4lNU0JKTgEV9EqYsp50";
    const Gemini = "AIzaSyAL71nBFGMto1bp1mz0LaR-vXPmWx6nK1E";

    // useEffect를 사용하여 컴포넌트가 마운트될 때 Tailwind CSS를 로드합니다.
    useEffect(() => {
        const script = document.createElement('script');
        script.src = "https://cdn.tailwindcss.com";
        document.head.appendChild(script);
        return () => {
            document.head.removeChild(script);
        };
    }, []);
    
    // Gemini API를 직접 호출하여 목적지 키워드를 추출하는 함수
    const extractDestinationWithGemini = async (text) => {
        try {
            const prompt = `주어진 텍스트에서 목적지나 장소 이름만 정확히 추출해줘. 예를 들어, '부산역 가줘', '해운대역으로 가고 싶어'라는 텍스트가 있으면 '부산역', '해운대역'만 추출해. 텍스트가 '해운대로 가줘'이면 '해운대'를 추출하고, '광안리로 가줘'이면 '광안리'를 추출해.`;
            const payload = {
                contents: [{
                    parts: [{ text: prompt + '\n\n' + text }]
                }],
            };

            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${Gemini}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Gemini API Error:", errorData);
                return null;
            }

            const result = await response.json();
            const extractedText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
            return extractedText ? extractedText.trim() : null;
        } catch (error) {
            console.error("Gemini API 호출 중 오류:", error);
            return null;
        }
    };

    const handleMicClick = () => {
        if (!('webkitSpeechRecognition' in window)) {
            setRecognitionStatus("이 브라우저는 음성 인식을 지원하지 않습니다.");
            return;
        }

        const recognition = new window.webkitSpeechRecognition();
        recognition.lang = 'ko-KR';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            setIsListening(true);
            setRecognitionStatus("듣는 중입니다...");
        };

        recognition.onresult = async (event) => {
            const transcript = event.results[0][0].transcript;
            console.log('Recognized text:', transcript);
            setRecognitionResult(transcript); // 전체 인식 텍스트를 상태에 저장
            setRecognitionStatus("인식 완료");
            
            try {
                const destination = await extractDestinationWithGemini(transcript);
                if (destination) {
                    setMessageInput(destination); // 추출된 목적지를 입력란에 표시
                    setRecognitionStatus("목적지가 입력되었습니다. '전송' 버튼을 눌러주세요.");
                } else {
                    setRecognitionStatus("목적지를 인식하지 못했습니다.");
                }
            } catch (error) {
                console.error("API 호출 중 오류:", error);
                setRecognitionStatus("API 호출 중 오류가 발생했습니다.");
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
            setRecognitionStatus("음성 인식 오류 발생");
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    const handleSendClick = () => {
        if (!messageInput.trim()) {
            setRecognitionStatus("목적지를 입력해주세요.");
            return;
        }
        // 목적지를 URL 쿼리 파라미터로 list 페이지에 전달
        navigate(`/list?destination=${encodeURIComponent(messageInput)}`);
    };

    return (
        <div className="bg-white flex flex-col items-center min-h-screen">
            {/* 상단: 마이크 버튼과 상태 메시지 */}
            <div className="flex flex-col items-center justify-center flex-1">
                <div 
                    id="recordButton" 
                    className={`relative w-16 h-16 mb-6 cursor-pointer ${isListening ? 'animate-pulse' : ''}`}
                    onClick={handleMicClick}
                >
                    <div className="outer-circle absolute inset-0 border-4 border-black rounded-full"
                        style={isListening ? { borderColor: '#ef4444', animation: 'pulse 1.5s infinite' } : {}}
                    ></div>
                    <div className="inner-circle absolute inset-0 m-3 bg-black rounded-full"
                        style={isListening ? { backgroundColor: '#ef4444' } : {}}
                    ></div>
                </div>
                <p 
                    id="recognitionStatus" 
                    className="text-xl font-medium text-center mb-8"
                >
                    {recognitionStatus}
                </p>
                {/* 전체 인식 텍스트를 표시하는 컨테이너, 텍스트가 있을 때만 보이도록 수정 */}
                <div id="resultContainer" className={`w-full max-w-md px-4 mb-8 ${recognitionResult ? '' : 'hidden'}`}>
                    <p className="text-sm text-gray-500 mb-2">전체 인식 텍스트:</p>
                    <div 
                        id="recognitionResult" 
                        className="p-3 bg-gray-100 rounded-md min-h-16 text-center"
                    >
                        {recognitionResult}
                    </div>
                </div>
            </div>
          
            {/* 하단: 입력창과 전송 버튼 */}
            <div className="w-full px-4 mt-auto mb-20">
                <div className={`w-full border border-blue-500 rounded-md flex overflow-hidden h-14 ${isInputFocused ? 'ring-2 ring-blue-500' : ''}`}>
                    <input 
                        id="messageInput"
                        type="text" 
                        className="flex-1 h-full px-4 outline-none font-bold text-lg" 
                        placeholder="도착지를 입력해주세요."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onFocus={() => setIsInputFocused(true)}
                        onBlur={() => setIsInputFocused(false)}
                    />
                    <button 
                        id="sendButton" 
                        className="w-24 h-full border-l border-blue-500 flex items-center justify-center text-blue-500 font-bold"
                        onClick={handleSendClick}
                    >
                        전송
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
