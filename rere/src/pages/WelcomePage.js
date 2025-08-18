// src/pages/WelcomePage.js

import React from 'react';
import { useNavigate } from 'react-router-dom';

function WelcomePage() {
    const navigate = useNavigate();

    const handleStart = () => {
        // '동의 및 시작하기' 버튼을 누르면 /speech 페이지로 이동
        navigate('/speech');
    };

    return (
        <div className="bg-white flex flex-col items-center justify-center min-h-screen p-6 text-center">
            <div className="w-full max-w-md">
                <h1 id="main-title" className="text-4xl md:text-5xl font-bold mb-4">여행의 시작, 버스 환승 도우미</h1>
                <p id="station-info" className="text-4xl md:text-5xl font-bold mb-8"></p>
                <p id="description" className="text-gray-500 text-lg mb-8">원활한 서비스 이용을 위해 개인정보 수집에 동의해주세요.</p>
                <button
                    id="startButton"
                    onClick={handleStart}
                    className="w-full py-4 px-4 rounded-lg bg-blue-500 text-white font-bold text-2xl hover:bg-blue-700 transition duration-300 shadow-md"
                    style={{ boxShadow: '3px 3px 6px gray' }}
                >
                    동의 및 시작하기
                </button>
            </div>
        </div>
    );
}

export default WelcomePage;