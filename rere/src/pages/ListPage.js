import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const ListPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const destination = searchParams.get('destination');
    const [results, setResults] = useState([]);
    const [status, setStatus] = useState("로딩 중...");

    // Tmap API 키
    const Tmap = "z1X5bjuncu1DaI5iBjpsr4lNU0JKTgEV9EqYsp50";

    useEffect(() => {
        // list.css의 스타일을 인라인으로 적용
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
    }, [destination, Tmap]);

    const handleItemClick = (poi) => {
        const destX = poi.frontLon;
        const destY = poi.frontLat;
        navigate(`/path?x=${destX}&y=${destY}`);
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

export default ListPage;
