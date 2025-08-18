import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';

// api.js 파일에서 가져오던 변수들을 직접 정의합니다.
// Tmap 및 Gemini 키는 보안상의 이유로 노출되지 않도록 처리됩니다.
const Tmap = 'z1X5bjuncu1DaI5iBjpsr4lNU0JKTgEV9EqYsp50';
const Gemini = 'AIzaSyAL71nBFGMto1bp1mz0LaR-vXPmWx6nK1E';

// WelcomePage Component - 앱의 시작 화면
const WelcomePage = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [stationName, setStationName] = useState("");
    const [descriptionText, setDescriptionText] = useState("원활한 서비스 이용을 위해 개인정보 수집에 동의해주세요.");
    
    useEffect(() => {
        // Tailwind CSS 로드 스크립트
        const script = document.createElement('script');
        script.src = "https://cdn.tailwindcss.com";
        document.head.appendChild(script);

        // 부산역의 고정된 좌표값
        const fixedLon = '129.047466';
        const fixedLat = '35.115893';

        // Tmap API 호출을 위한 기본 URL
        const tmapBaseUrl = 'https://apis.openapi.sk.com/tmap/pois/search/nearStation?version=1&resCoordType=WGS84GEO&searchKeyword=%EC%A0%95%EB%A5%98%EC%9E%A5&appKey=';
        const url = `${tmapBaseUrl}${Tmap}&centerLon=${fixedLon}&centerLat=${fixedLat}`;

        const fetchBusStation = async () => {
            try {
                const response = await fetch(url);
                const data = await response.json();
                
                const station = data.searchNearStationInfo?.nearStationList?.stationList?.[0]?.stationName;
                
                if (station) {
                    setStationName(station);
                    setDescriptionText('현재 위치에서 가장 가까운 정류장입니다.');
                } else {
                    setStationName('정류장 정보를 찾을 수 없습니다.');
                    setDescriptionText('API 호출에 실패했거나 주변에 정류장이 없습니다.');
                }
            } catch (error) {
                console.error('API 호출 중 오류가 발생했습니다:', error);
                setStationName('API 호출 실패');
                setDescriptionText('네트워크 오류가 발생했습니다. 다시 시도해 주세요.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchBusStation();
        
        return () => {
            document.head.removeChild(script);
        };
    }, []);

    const handleStartClick = () => {
        const startX = '129.047466';
        const startY = '35.115893';
        navigate(`/home?startX=${startX}&startY=${startY}`);
    };

    return (
        <div className="bg-white flex flex-col items-center justify-center min-h-screen p-6 text-center">
            <div className="w-full max-w-md">
                {/* 메인 타이틀 */}
                <h1 id="main-title" className="text-4xl md:text-5xl font-bold mb-4">여행의 시작, 버스 환승 도우미</h1>
                
                {/* API 호출 후 정류장 이름이 표시될 영역 */}
                <p id="station-info" className="text-4xl md:text-5xl font-bold mb-8">
                    {stationName}
                </p>

                {/* 설명 텍스트 */}
                <p id="description" className="text-gray-500 text-lg mb-8">
                    {descriptionText}
                </p>

                {/* 시작하기 버튼 */}
                <button 
                    id="startButton" 
                    style={{boxShadow: '3px 3px 6px gray'}} 
                    className="w-full py-4 px-4 rounded-lg bg-blue-500 text-white font-bold text-2xl hover:bg-blue-700 transition duration-300 shadow-md" 
                    onClick={handleStartClick}
                    disabled={isLoading}
                >
                    동의 및 시작하기
                </button>
                
                {/* 로딩 스피너 (API 호출 시 표시) */}
                {isLoading && (
                    <div id="loading" className="mt-8">
                        <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
};

// HomePage Component
const HomePage = () => {
    const navigate = useNavigate();
    const [isListening, setIsListening] = useState(false);
    const [recognitionStatus, setRecognitionStatus] = useState("도착지를 말하려면 원형을 클릭하세요");
    const [recognitionResult, setRecognitionResult] = useState("");
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [messageInput, setMessageInput] = useState("");
    
    useEffect(() => {
        const script = document.createElement('script');
        script.src = "https://cdn.tailwindcss.com";
        document.head.appendChild(script);
        return () => {
            document.head.removeChild(script);
        };
    }, []);
    
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
            setRecognitionResult(transcript);
            setRecognitionStatus("인식 완료");
            
            try {
                const destination = await extractDestinationWithGemini(transcript);
                if (destination) {
                    setMessageInput(destination);
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
        navigate(`/list?destination=${encodeURIComponent(messageInput)}`);
    };

    return (
        <div className="bg-white flex flex-col items-center min-h-screen">
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

// ListPage Component
const ListPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const destination = searchParams.get('destination');
    const [results, setResults] = useState([]);
    const [status, setStatus] = useState("로딩 중...");
    
    useEffect(() => {
        const styleSheet = `
            html, body {
                margin: 0;
                padding: 0;
                height: 100%;
                font-family: 'Segoe UI', sans-serif;
                background: #f5f6fa;
            }
            #search-panel {
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
                align-items: center;
                width: 100%;
                height: 100%;
                padding: 40px 20px;
                box-sizing: border-box;
            }
            h2 {
                margin-top: 0;
                font-size: 60px;
                color: #333;
            }
            .input-display {
                font-size: 40px;
                color: #555;
                margin: 10px 0 20px 0;
                text-align: center;
            }
            .result-list {
                list-style: none;
                padding: 0;
                margin: 0;
                width: 100%;
                max-width: 800px;
                height: 1200px;
                overflow-y: auto;
                background: #ffffff;
                border: 1px solid #ccc;
                border-radius: 12px;
                box-shadow: 0 0 12px rgba(0, 0, 0, 0.1);
            }
            .result-list li {
                padding: 10px 24px;
                font-size: 55px;
                font-weight: 500;
                cursor: pointer;
                display: flex;
                border-bottom: 1px solid #eee;
                flex-direction: column;
                justify-content: center;
            }
            .result-list li:hover {
                background: #f0f0f0;
            }
            .result-name {
                font-weight: bold;
                margin-bottom: 5px;
                color: #007bff;
                word-break: break-all;
                line-height: 1.2;
            }
            .result-address {
                font-size: 0.7em;
                color: #888;
                word-break: break-all;
                line-height: 1.2;
            }
        `;
        const styleTag = document.createElement('style');
        styleTag.innerHTML = styleSheet;
        document.head.appendChild(styleTag);
        return () => {
            document.head.removeChild(styleTag);
        };
    }, []);

    useEffect(() => {
        if (!destination || destination.trim().length < 2) {
            setStatus('입력된 텍스트가 없거나 너무 짧습니다.');
            return;
        }

        setStatus(`입력된 검색어: "${destination}"`);

        const fetchPois = async () => {
            try {
                const response = await fetch(`https://apis.openapi.sk.com/tmap/pois?version=1&searchKeyword=${encodeURIComponent(destination)}&resCoordType=WGS84GEO&reqCoordType=WGS84GEO&count=20&appKey=${Tmap}`);
                const data = await response.json();
                
                const pois = data.searchPoiInfo?.pois?.poi || [];
                if (pois.length === 0) {
                    setStatus("검색 결과가 없습니다");
                } else {
                    setResults(pois);
                }
            } catch (error) {
                console.error("Tmap API 호출 중 오류:", error);
                setStatus("API 호출 중 오류가 발생했습니다.");
            }
        };

        fetchPois();
    }, [destination]);

    const handleItemClick = (poi) => {
        const destX = poi.frontLon;
        const destY = poi.frontLat;
        // 출발지 좌표와 도착지 좌표를 모두 PathPage로 전달
        navigate(`/path?startX=129.047466&startY=35.115893&destX=${destX}&destY=${destY}`);
    };

    return (
        <div id="search-panel">
            <h2>도착지 자동완성</h2>
            <div className="input-display">{status}</div>
            <ul className="result-list">
                {results.length > 0 ? (
                    results.map((poi, index) => (
                        <li key={index} onClick={() => handleItemClick(poi)}>
                            <div className="result-name">{poi.name}</div>
                            <div className="result-address">
                                {poi.newAddressList && poi.newAddressList.newAddress && poi.newAddressList.newAddress.length > 0
                                    ? poi.newAddressList.newAddress[0].fullAddressRoad
                                    : '주소 정보 없음'}
                            </div>
                        </li>
                    ))
                ) : (
                    <li>{status === "로딩 중..." ? "로딩 중..." : "검색 결과가 없습니다"}</li>
                )}
            </ul>
        </div>
    );
};

// PathPage Component
const PathPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [paths, setPaths] = useState([]);
    const [status, setStatus] = useState("경로 찾는 중...");
    const startX = searchParams.get('startX');
    const startY = searchParams.get('startY');
    const destX = searchParams.get('destX');
    const destY = searchParams.get('destY');

    useEffect(() => {
        const styleSheet = `
            html, body {
                margin: 0;
                padding: 0;
                height: 100%;
                font-family: 'Segoe UI', sans-serif;
                background: #f5f6fa;
            }
            #path-panel {
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
                align-items: center;
                width: 100%;
                height: 100%;
                padding: 40px 20px;
                box-sizing: border-box;
            }
            .back-button {
                position: absolute;
                top: 20px;
                left: 20px;
                font-size: 30px;
                color: #333;
                cursor: pointer;
                z-index: 10;
            }
            h2 {
                margin-top: 0;
                font-size: 60px;
                color: #333;
            }
            .status-display {
                font-size: 40px;
                color: #555;
                margin: 10px 0 20px 0;
                text-align: center;
            }
            .path-list {
                list-style: none;
                padding: 0;
                margin: 0;
                width: 100%;
                max-width: 800px;
                height: 1200px;
                overflow-y: auto;
                background: #ffffff;
                border: 1px solid #ccc;
                border-radius: 12px;
                box-shadow: 0 0 12px rgba(0, 0, 0, 0.1);
            }
            .path-list li {
                padding: 10px 24px;
                font-size: 40px;
                font-weight: 500;
                cursor: pointer;
                display: flex;
                flex-direction: column;
                border-bottom: 1px solid #eee;
                transition: background-color 0.2s ease;
            }
            .path-list li:hover {
                background: #f0f0f0;
            }
            .path-summary {
                display: flex;
                flex-direction: column;
                width: 100%;
            }
            .path-summary-top {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .path-summary-details {
                display: flex;
                justify-content: space-between;
                font-size: 0.6em;
                color: #666;
            }
        `;
        const styleTag = document.createElement('style');
        styleTag.innerHTML = styleSheet;
        document.head.appendChild(styleTag);
        return () => {
            document.head.removeChild(styleTag);
        };
    }, []);

    useEffect(() => {
        if (!startX || !startY || !destX || !destY) {
            setStatus('출발지 또는 도착지 정보가 없습니다.');
            return;
        }

        const fetchPaths = async () => {
            try {
                const response = await fetch(`https://apis.openapi.sk.com/tmap/transit/paths?version=1&startX=${startX}&startY=${startY}&endX=${destX}&endY=${destY}&format=json&appKey=${Tmap}`);
                const data = await response.json();

                const pathList = data.metaData?.plan?.itineraries || [];
                if (pathList.length === 0) {
                    setStatus("검색 결과가 없습니다.");
                } else {
                    setPaths(pathList);
                    setStatus("경로를 찾았습니다.");
                }

            } catch (error) {
                console.error("Tmap API 호출 중 오류:", error);
                setStatus("API 호출 중 오류가 발생했습니다.");
            }
        };

        fetchPaths();
    }, [startX, startY, destX, destY]);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        if (hours > 0) {
            return `${hours}시간 ${remainingMinutes}분`;
        }
        return `${minutes}분`;
    };

    const formatDistance = (meters) => {
        if (meters >= 1000) {
            return `${(meters / 1000).toFixed(1)}km`;
        }
        return `${meters}m`;
    };

    return (
        <div id="path-panel">
            <button className="back-button" onClick={() => navigate(-1)}>←</button>
            <h2>경로 찾기 결과</h2>
            <div className="status-display">{status}</div>
            <ul className="path-list">
                {paths.length > 0 ? (
                    paths.map((path, index) => (
                        <li key={index} className="path-item">
                            <div className="path-summary">
                                <div className="path-summary-top">
                                    <span className="font-bold text-lg">
                                        총 시간: {formatTime(path.totalTime)}
                                    </span>
                                    <span className="text-xl font-bold text-red-500">
                                        {path.fare?.regular?.totalFare?.toLocaleString()}원
                                    </span>
                                </div>
                                <div className="path-summary-details">
                                    <span>환승: {path.transferCount}회</span>
                                    <span>총 거리: {formatDistance(path.totalDistance)}</span>
                                    <span>도보: {formatDistance(path.totalWalkDistance)}</span>
                                </div>
                            </div>
                        </li>
                    ))
                ) : (
                    <li>{status}</li>
                )}
            </ul>
        </div>
    );
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<WelcomePage />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/list" element={<ListPage />} />
                <Route path="/path" element={<PathPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
