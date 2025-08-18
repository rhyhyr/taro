import React, { useState, useEffect } from 'react';
import * as PathProcessor from './path_processor.js';
import { TTS_FUNCTION_URL } from './app_config_state.js';

// 기존 path.css 파일을 import하여 스타일을 적용합니다.
import './path.css';

function PathPage({ startCoordinates, destinationCoordinates, onBack }) { 
    const [loading, setLoading] = useState(true);
    const [totalTime, setTotalTime] = useState(0);
    const [routeSteps, setRouteSteps] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [showRating, setShowRating] = useState(false);
    const [selectedRating, setSelectedRating] = useState(0);

    const startX = startCoordinates.x;
    const startY = startCoordinates.y;
    const endX = destinationCoordinates?.x;
    const endY = destinationCoordinates?.y;

    useEffect(() => {
        const fetchRouteData = async () => {
            setLoading(true);
            try {
                const routeData = await PathProcessor.fetchAndScorePaths(startX, startY, endX, endY);
                if (routeData) {
                    const { bestPath } = routeData;
                    const processedSteps = PathProcessor.filterAndProcessSteps(bestPath.steps);

                    setRouteSteps(processedSteps);
                    setTotalTime(bestPath.totalTime);
                } else {
                    console.log("유효한 경로를 찾을 수 없습니다.");
                }
            } catch (error) {
                console.error("경로 데이터 호출 중 오류:", error);
            } finally {
                setLoading(false);
            }
        };

        if (endX && endY) {
            fetchRouteData();
        }
    }, [endX, endY, startX, startY]);

    const handleNextStep = () => {
        if (currentStepIndex < routeSteps.length - 1) {
            setCurrentStepIndex(currentStepIndex + 1);
        }
        if (currentStepIndex === routeSteps.length - 2) {
            setShowRating(true);
        }
    };

    const handlePrevStep = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(currentStepIndex - 1);
            setShowRating(false);
        }
    };

    const handleListen = async () => {
        if (!routeSteps[currentStepIndex]) return;
        const { description } = routeSteps[currentStepIndex];
        try {
            const res = await fetch(`${TTS_FUNCTION_URL}?text=${encodeURIComponent(description)}`);
            const audioBlob = await res.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.play();
        } catch (error) {
            console.error('TTS 실패:', error);
        }
    };

    const handleTransfer = () => {
        handleNextStep();
    };

    const handleStarClick = (value) => {
        setSelectedRating(value);
        console.log(`선택된 별점: ${value}`);
    };

    if (loading) {
        return (
            <div id="loadingOverlay">
                <div className="bus-container">
                    <div className="bus-animation">
                        <span className="bus-icon">🚌</span>
                    </div>
                </div>
                <div id="loadingText">버스를 찾고있습니다.</div>
            </div>
        );
    }

    if (!routeSteps || routeSteps.length === 0) {
        return (
            <div className="text-center mt-20">
                <p>경로를 찾을 수 없습니다.</p>
                <button onClick={onBack} className="mt-4 px-4 py-2 bg-gray-200 rounded">뒤로가기</button>
            </div>
        );
    }

    const currentStep = routeSteps[currentStepIndex];

    return (
        <div className="bg-white flex flex-col items-center min-h-screen p-4">
            <button className="back-button" onClick={onBack}>←</button>
            <div id="mainContent" className="max-w-md w-full">
                <div className="flex items-center justify-end mb-12">
                    <span className="text-xl font-bold" id="totalTime">총 소요시간: {totalTime}분</span>
                </div>
                
                <div className="relative mb-14 px-4">
                    {/* 경로 시각화 */}
                    {/* ... (기존 path.html의 시각화 관련 JSX) */}
                    <div className="flex items-center justify-between" id="progressContainer"></div>
                </div>

                {/* 이미지 추가 */}
                <img id="myImage" src="/IMG_7458.jpeg" alt="정류장ID: 03719" />
                
                <div className="text-center mb-14">
                    <p id="walkInstruction">{currentStep.description}</p>
                </div>
                
                <div className="text-center mb-14" id="busInfo">
                    <p className="text-4xl font-bold">
                        <span id="busNumber">{currentStep.busNumber || '-'}</span> 승차
                    </p>
                </div>
                
                <div className="text-center mb-14" id="destInfo">
                    <p className="text-3xl font-bold">
                        <span id="destination">{currentStep.destination || '-'}</span> 하차
                    </p>
                </div>

                {showRating && (
                    <div id="starRatingSection" className="center-star-rating">
                        <div className="star-rating">
                            {[1, 2, 3, 4, 5].map((value) => (
                                <span
                                    key={value}
                                    className={`star ${selectedRating >= value ? 'active' : ''}`}
                                    data-value={value}
                                    onClick={() => handleStarClick(value)}
                                >
                                    ★
                                </span>
                            ))}
                        </div>
                    </div>
                )}
                
                <div className="text-center mb-10">
                    <p id="transferInstruction" className="text-xl">하차 후, 환승을 누르세요</p>
                </div>
                
                <div className="flex gap-4 mb-14" id="buttonGroup">
                    <button
                        id="listenBtn"
                        onClick={handleListen}
                        className="flex-1 py-4 border border-blue-500 rounded-md text-blue-500 font-medium hover:bg-blue-50 transition-colors"
                    >
                        음성 안내 받기
                    </button>
                    <button
                        id="transferBtn"
                        onClick={handleTransfer}
                        className="flex-1 py-4 bg-blue-500 rounded-md text-white font-medium hover:bg-blue-600 transition-colors"
                    >
                        환승
                    </button>
                </div>
                
                <div className="text-center mb-5">
                    <p className="text-gray-500">
                        <span id="distanceTime">0분</span> 거리에
                        <span id="fasterTime">0분</span> 빠른 경로가 존재합니다.
                    </p>
                </div>
                
                <div className="w-full flex justify-center mt-5">
                    <button id="viewRouteBtn" className="text-blue-500 border-b border-blue-500 pb-1 hover:text-blue-600 transition-colors">다른 경로 보기</button>
                </div>
            </div>
        </div>
    );
}

export default PathPage;