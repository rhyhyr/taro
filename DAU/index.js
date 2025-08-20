async function init() {
    // 1. HTML에서 필요한 요소들을 가져옵니다.
    const startButton = document.getElementById('startButton');
    const stationInfo = document.getElementById('station-info');
    const mainTitle = document.getElementById('main-title');
    const description = document.getElementById('description');
    const loading = document.getElementById('loading');

    let currentCoords = null; // URL에서 받은 좌표를 저장할 변수

    // 2. 페이지 URL에서 x, y 좌표를 추출합니다.
    const urlParams = new URLSearchParams(window.location.search);
    const x = urlParams.get('x');
    const y = urlParams.get('y');

    // 3. 좌표 유무에 따라 초기 동작을 결정합니다.
    if (x && y) {
        currentCoords = { x, y };
        console.log('URL에서 받은 좌표:', currentCoords);
        loading.classList.remove('hidden'); // 로딩 애니메이션 표시
        // 좌표가 있으면 우리 서버에 정류장 정보 조회를 요청합니다.
        await fetchNearestBusStopFromServer(currentCoords);
    } else {
        // 좌표가 없으면 사용자에게 알립니다.
        stationInfo.textContent = 'URL에 좌표 정보가 없습니다.';
        console.error('URL에 x, y 파라미터가 필요합니다.');
        return; // 실행 중단
    }

    // 4. '시작하기' 버튼에 클릭 이벤트를 추가합니다.
    startButton.addEventListener('click', () => {
        if (currentCoords) {
            startButton.disabled = true;
            startButton.classList.add('opacity-50', 'cursor-not-allowed');
            loading.classList.remove('hidden');
            // 백엔드 서버로 좌표를 전송하고 다음 페이지로 이동합니다.
            sendCoordinatesToServer(currentCoords);
        } else {
            alert('좌표 정보가 없어 시작할 수 없습니다.');
        }
    });

    /**
     * ODsay API 대신 우리 서버에 정류장 정보를 요청하는 함수.
     * CORS 문제를 해결하고 API 키를 안전하게 관리할 수 있습니다.
     * @param {object} coords - {x, y} 좌표 객체
     */
    async function fetchNearestBusStopFromServer(coords) {
        // ★★★ 핵심 변경점 ★★★
        // ODsay API가 아닌, 우리 Spring Boot 서버에 만든 API 엔드포인트로 요청합니다.
        const url = `/api/station?x=${coords.x}&y=${coords.y}`;

        try {
            const response = await fetch(url);
            console.log(response);
            if (!response.ok) {
                throw new Error(`서버 응답 오류! status: ${response.status}`);
            }
            
            const data = await response.json(); // 서버가 전달해준 ODsay 응답 결과를 JSON으로 파싱
            console.log(data);
            if (data.error) {
                // 서버 또는 ODsay API에서 발생한 에러 메시지를 표시
                throw new Error(data.error.message || '서버에서 API 호출에 실패했습니다.');
            }
            
            // 성공적으로 데이터를 받으면 화면을 업데이트합니다.
            if (data.result?.station?.length > 0) {
                const nearestStation = data.result.station[0];
                mainTitle.classList.add('hidden');
                stationInfo.innerHTML = `현재 위치는 <br> <strong class="text-blue-600">${nearestStation.stationName}</strong>입니다.`;
            } else {
                stationInfo.innerHTML = '주변 3m 내에 버스 정류장이 없습니다.';
            }
        } catch (error) {
            console.error('서버로부터 정류장 정보 조회 중 오류 발생:', error);
            stationInfo.innerHTML = '정류장 정보를 가져오는 중 오류가 발생했습니다.';
        } finally {
            // 성공하든 실패하든 로딩 애니메이션을 숨기고 버튼을 활성화합니다.
            loading.classList.add('hidden');
            startButton.disabled = false;
        }
    }

    /**
     * 백엔드 서버로 최종 좌표를 전송하고 다음 페이지로 이동하는 함수.
     * 이 부분의 로직은 기존과 동일합니다.
     * @param {object} coords - {x, y} 좌표 객체
     */
    async function sendCoordinatesToServer(coords) {
        try {
            const response = await fetch("/list", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(coords)
            });
            if (response.ok) {
                window.location.href = "/speech";
            } else {
                throw new Error('서버 응답 실패');
            }
        } catch (error) {
            console.error('좌표 전송 중 에러 발생:', error);
            alert('서버에 좌표를 전송하는 데 실패했습니다.');
            // 실패 시 버튼을 다시 활성화
            startButton.disabled = false;
            startButton.classList.remove('opacity-50', 'cursor-not-allowed');
            loading.classList.add('hidden');
        }
    }
}

// HTML 문서가 완전히 로드되면 init 함수를 실행합니다.
document.addEventListener('DOMContentLoaded', init);
