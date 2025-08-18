// api.js 파일에서 API 키를 가져옵니다.
import { ODsay_ip } from './api.js';

document.addEventListener('DOMContentLoaded', function () {
    // HTML 요소들을 가져옵니다.
    const startButton = document.getElementById('startButton');
    const stationInfo = document.getElementById('station-info');
    const mainTitle = document.getElementById('main-title');
    const loading = document.getElementById('loading');

    let currentCoords = null; // URL에서 받은 좌표를 저장할 변수

    // 1. 페이지 로드 시 URL에서 좌표를 파싱합니다.
    const urlParams = new URLSearchParams(window.location.search);
    const x = urlParams.get('x');
    const y = urlParams.get('y');

    if (x && y) {
        currentCoords = { x, y };
        console.log('URL에서 받은 좌표:', currentCoords);
        // 좌표가 있으면 로딩 스피너를 표시하고 정류장 정보를 가져옵니다.
        loading.classList.remove('hidden');
        fetchNearestBusStop(currentCoords);
    } else {
        // 좌표가 없으면 사용자에게 알립니다.
        stationInfo.textContent = 'URL에 좌표 정보가 없습니다.';
        console.error('URL에 x, y 파라미터가 필요합니다.');
    }

    // '시작하기' 버튼 클릭 이벤트
    startButton.addEventListener('click', function () {
        if (currentCoords) {
            // 버튼 비활성화 및 로딩 표시
            startButton.disabled = true;
            startButton.classList.add('opacity-50', 'cursor-not-allowed');
            loading.classList.remove('hidden');
            
            // 서버로 좌표를 전송합니다.
            sendCoordinatesToServer(currentCoords);
        } else {
            alert('좌표 정보가 없어 시작할 수 없습니다.');
        }
    });

    // 2. ODsay API로 가장 가까운 버스 정류장 정보 가져오기
    async function fetchNearestBusStop(coords) {
        const radius = 3; // 200m 반경
        const url = `https://api.odsay.com/v1/api/pointSearch?lang=0&x=${coords.x}&y=${coords.y}&radius=${radius}&stationClass=1&apiKey=${encodeURIComponent(ODsay_ip)}`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message);
            }
            
            if (data.result && data.result.station && data.result.station.length > 0) {
                const nearestStation = data.result.station[0];
                console.log('가장 가까운 정류장:', nearestStation);
                
                // UI 업데이트
                mainTitle.classList.add('hidden');
                
                stationInfo.innerHTML = `현재 위치는 <br> <strong class="text-blue-600">${nearestStation.stationName}</strong>입니다.`;
            } else {
                stationInfo.innerHTML = '주변 3m 내에 버스 정류장이 없습니다.';
            }

        } catch (error) {
            console.error('ODsay API 호출 중 오류 발생:', error);
            stationInfo.innerHTML = '정류장 정보를 가져오는 중 오류가 발생했습니다.';
        } finally {
            // API 호출이 끝나면 로딩을 숨기고 버튼을 활성화합니다.
            loading.classList.add('hidden');
            startButton.disabled = false;
        }
    }

    // 3. 백엔드 서버로 좌표 전송 및 페이지 이동
    async function sendCoordinatesToServer(coords) {
        try {
            const response = await fetch("/list", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(coords)
            });

            if (response.ok) {
                console.log('좌표 전송 성공. 페이지를 이동합니다.');
                window.location.href = "/speech";
            } else {
                throw new Error('서버 응답 실패');
            }
        } catch (error) {
            console.error('좌표 전송 중 에러 발생:', error);
            alert('서버에 좌표를 전송하는 데 실패했습니다.');
            // UI 초기화
            startButton.disabled = false;
            startButton.classList.remove('opacity-50', 'cursor-not-allowed');
            loading.classList.add('hidden');
        }
    }
});
