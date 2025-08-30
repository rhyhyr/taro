// main_app.js
// 애플리케이션의 메인 로직, 사용자 상호작용 및 흐름 관리, TTS 연동을 담당합니다.

// 필요한 모듈들을 가져옵니다.
import * as AppState from './app_config_state.js'; // 전역 상태 및 설정
import * as PathProcessor from './path_processor.js'; // 경로 데이터 처리 로직
import * as UIManager from './ui_manager.js'; // UI 제어 로직

/**
 * 특정 경로 단계를 렌더링하고 UI를 업데이트합니다.
 * @param {number} stepIndex - 렌더링할 경로 단계의 인덱스 (0부터 시작)
 */
async function renderCurrentStep(stepIndex) {
  // 모든 세그먼트가 완료된 경우 (currentStep이 routeSteps.length와 같아진 경우)에는 추가 렌더링 없이 종료
  if (stepIndex > AppState.routeSteps.length) return; 

  // 모든 경로 단계 변경 시 이미지 상태를 초기화합니다.
  setupImage(null);

  AppState.updateCurrentStep(stepIndex); // 현재 단계 업데이트

  // updateProgressDots에는 현재 완료된 세그먼트의 인덱스를 전달합니다.
  UIManager.updateProgressDots(AppState.currentStep);
  // moveBusIcon에는 현재 세그먼트의 인덱스와 전체 세그먼트 수를 전달하여 버스가 세그먼트의 끝으로 이동하도록 합니다.
  UIManager.moveBusIcon(AppState.currentStep, AppState.routeSteps.length);
  
  // 현재 단계가 마지막 세그먼트보다 작을 때만 다음 세그먼트의 정보를 사용
  const sub = AppState.routeSteps[AppState.currentStep]; 

  if (sub) { // sub가 존재할 때만 UI 업데이트
    if (sub.trafficType === 2) { // 대중교통 (버스)
	  const busArrivalData = await PathProcessor.getMinArrivalTime(sub.startLocalStationID, sub.lane[0].busNo);
      sub.min1 = busArrivalData ? busArrivalData.min1 : null;
            
      UIManager.setCurrentStation(sub.startName);
      UIManager.setDestination(sub.endName);
      UIManager.setBusNumber(sub.lane[0].busNo, sub.busType, sub.min1);
      document.getElementById('busInfo').style.display = 'block';
      document.getElementById('destInfo').style.display = 'block';
      document.getElementById('listenBtn').style.display = 'inline-block';
      document.getElementById('transferBtn').innerText = '환승';
      // ✨BUG FIX: 버스 안내 시, 환승 안내 문구로 변경합니다.
      document.getElementById('transferInstruction').innerText = '하차 후, 환승을 누르세요';

      const transferBtn = document.getElementById('transferBtn');
      transferBtn.classList.remove('w-full');
      transferBtn.classList.add('flex-1');
      // 버튼 style 변경
      transferBtn.classList.add('bus-transfer-button');
      

    } else if (sub.trafficType === 3) { // 도보
      const next = AppState.routeSteps[stepIndex + 1];
      UIManager.setCurrentStation(`<span class="overall-bold">${sub.distance}m 거리에 있는 <br> <span class="highlight-station">${next?.startName || '다음 정류장'}</span>(으)로 가세요.</span>`, true);
      document.getElementById('busInfo').style.display = 'none';
      document.getElementById('destInfo').style.display = 'none';
      document.getElementById('listenBtn').style.display = 'none';
      document.getElementById('transferBtn').innerText = '도착';
      document.getElementById('transferInstruction').innerText = '이동 후, 도착을 누르세요';

      const transferBtn = document.getElementById('transferBtn');
      transferBtn.classList.remove('flex-1');
      transferBtn.classList.add('w-full');
      
      // 버튼 style 변경
      transferBtn.classList.remove('bus-transfer-button');

      // 이미지 활성화 조건 체크
      setupImage(next);
    }
  }

  // '환승' 버튼 및 지시문 표시/숨김 로직
  // 현재 단계가 총 세그먼트 수와 같으면 (즉, 모든 세그먼트를 완료했으면) 버튼 숨김
  const hasNextStep = AppState.currentStep < AppState.routeSteps.length;
  UIManager.toggleTransferButtonAndInstruction(hasNextStep);

  // 마지막 단계인 경우 '도착' 버튼 표시
  // currentStep이 마지막 세그먼트의 인덱스(`routeSteps.length - 1`)와 같으면 '도착' 표시
  if (AppState.currentStep === AppState.routeSteps.length - 1) {
    document.getElementById('transferBtn').innerText = '도착';
    document.getElementById('transferInstruction').innerText = '목적지에 도착 후, 도착을 누르세요';
    UIManager.toggleRecommendationInfo(false); // 도착 시 추천 경로 정보 숨김
  } else if (AppState.currentStep < AppState.routeSteps.length -1 ) { // 마지막 단계 전이면 '환승' 안내
    //document.getElementById('transferInstruction').innerText = '하차 후, 환승을 누르세요';
  } else { // 모든 경로를 완료한 후 상태 (currentStep === AppState.routeSteps.length)
      UIManager.toggleTransferButtonAndInstruction(false); // 버튼 숨김
      UIManager.toggleRecommendationInfo(false);
  }
}

/**
 * 계산된 경로 정보를 UI에 적용하여 표시합니다.
 * @param {object} path - 적용할 경로 데이터 객체
 */
function applyRoute(path) {
  const filteredSubPaths = PathProcessor.filterAndPrepareRouteSteps(path);

  UIManager.setTotalTime(path.info.totalTime); // 총 소요 시간 설정
  AppState.updateRouteSteps(filteredSubPaths); // 필터링된 경로 단계 저장
  UIManager.setupDots(AppState.routeSteps); // 경로 단계 배열 자체를 전달
  renderCurrentStep(0); // 첫 번째 단계 렌더링

  // '환승' 버튼 및 지시문 표시/숨김 로직
  const hasNextStep = AppState.routeSteps.length > 0 && AppState.currentStep < AppState.routeSteps.length;
  UIManager.toggleTransferButtonAndInstruction(hasNextStep);
}

/**
 * '듣기' 버튼 클릭 시 음성 합성을 요청하고 재생합니다.
 * @param {HTMLButtonElement} listenBtnElement - '듣기' 버튼 DOM 요소
 * @param {string} station - 현재 정류장 이름
 * @param {string} bus - 버스 번호
 * @param {string} dest - 목적지 이름
 */
async function handleListenButtonClick(listenBtnElement, station, bus, dest) {
  listenBtnElement.disabled = true;
  listenBtnElement.textContent = '음성 생성 중...';

  const textToSpeak = `현재 정류장은 ${station}입니다. ${bus}을 탑승 후 ${dest}에서 하차하세요.`;

  try {
    const response = await fetch(AppState.TTS_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: textToSpeak }),
    });

    if (!response.ok) {
      throw new Error(`서버 오류: ${response.status}`);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.play();

    audio.onended = () => {
      listenBtnElement.disabled = false;
      listenBtnElement.textContent = '음성 안내 받기';
      URL.revokeObjectURL(audioUrl);
    };

  } catch (error) {
    console.error('TTS 기능 오류:', error);
    alert('음성을 생성하는 데 실패했습니다.');
    listenBtnElement.disabled = false;
    listenBtnElement.textContent = '음성 안내 받기';
  }
}

// DOM 콘텐츠 로드 완료 시 애플리케이션 초기화
window.addEventListener('DOMContentLoaded', async () => {
  UIManager.toggleLoadingOverlay(true); // 로딩 오버레이 표시

  // Thymeleaf에서 주입된 출발/도착 좌표를 window 객체에서 가져옵니다.
  const startx = window.startx;
  const starty = window.starty;
  const endx = window.endx;
  const endy = window.endy;

  // API 키 유효성 검사
  if (!AppState.ODsay_url || !AppState.Busan) {
      alert("API 키가 로드되지 않았습니다. api.js 파일과 app_config_state.js 파일의 설정을 확인해주세요.");
      UIManager.toggleLoadingOverlay(false); // 로딩 오버레이 숨김
      return;
  }

  try {
    const pathResults = await PathProcessor.fetchAndScorePaths(startx, starty, endx, endy);

    if (!pathResults) {
      alert("도착 정보가 있는 유효한 경로가 없습니다.");
      UIManager.toggleLoadingOverlay(false);
      //window.location.href = `/list`;
      return;
      
    }

    const { bestPath, fastestPath } = pathResults;

    AppState.updateBestTotalPath(bestPath.path);
    AppState.updateBestTotalTime(bestPath.totalTime);

    // 최적 경로와 가장 빠른 경로가 다르고, 가장 빠른 경로가 더 빠른 경우에만 추천 경로 표시
    const showRecommended = fastestPath.path.info.totalTime !== bestPath.path.info.totalTime && fastestPath.path.info.totalTime < bestPath.path.info.totalTime;

    if (showRecommended) {
      AppState.updateRecommendedTotalPath(fastestPath.path);
      AppState.updateRecommendedTime(fastestPath.totalTime);
      UIManager.toggleRecommendationInfo(true, 
                                        `${fastestPath.path.subPath[0]?.distance || 0}m`, 
                                        `${AppState.bestTotalTime - AppState.recommendedTime}분`);
      UIManager.setViewRouteButtonText("다른 경로 보기");
    } else {
      UIManager.toggleRecommendationInfo(false); // 추천 경로 정보 숨김
    }

    UIManager.toggleLoadingOverlay(false); // 로딩 오버레이 숨김
    applyRoute(AppState.bestTotalPath); // 최적 경로 적용
  } catch (error) {
    console.error("경로 검색 중 오류 발생:", error);
    alert("경로를 검색하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    UIManager.toggleLoadingOverlay(false);
  }
});

// '경로 보기' 버튼 클릭 이벤트 리스너
document.getElementById('viewRouteBtn').addEventListener('click', () => {
  if (!AppState.isShowingRecommendedRoute) { // 현재 최적 경로를 보고 있는 경우
    if (AppState.recommendedTotalPath) { // 추천 경로가 있다면
      applyRoute(AppState.recommendedTotalPath); // 추천 경로 적용
      AppState.updateIsShowingRecommendedRoute(true); // 추천 경로를 보고 있음을 표시
      UIManager.setViewRouteButtonText("↩︎ 이전 경로"); // 버튼 텍스트 변경
      document.querySelector('.text-gray-500').textContent = `${AppState.bestTotalTime - AppState.recommendedTime}분 빠른 경로로 변경되었습니다.`; // 변경 알림
    } else {
      alert('더 빠른 추천 경로가 없습니다.');
    }
  } else { // 현재 추천 경로를 보고 있는 경우 (이전 경로로 돌아가기)
    if (AppState.bestTotalPath) { // 최적 경로가 있다면
      applyRoute(AppState.bestTotalPath); // 최적 경로 적용
      AppState.updateIsShowingRecommendedRoute(false); // 최적 경로를 보고 있음을 표시
      UIManager.setViewRouteButtonText("다른 경로 보기"); // 버튼 텍스트 변경
      if (AppState.recommendedTotalPath && AppState.bestTotalTime > AppState.recommendedTime) { 
        UIManager.toggleRecommendationInfo(true, 
                                          `${AppState.recommendedTotalPath.subPath[0]?.distance || 0}m`, 
                                          `${AppState.bestTotalTime - AppState.recommendedTime}분`);
      } else { 
        UIManager.toggleRecommendationInfo(false);
      }
    } else {
      alert('이전 경로 정보를 찾을 수 없습니다.');
    }
  }
});

// '환승' 버튼 클릭 이벤트 리스너
document.getElementById('transferBtn').addEventListener('click', () => {
  // AppState.currentStep은 현재 완료된 세그먼트를 나타내므로, routeSteps.length와 같아지면 모든 세그먼트 완료
  if (AppState.currentStep < AppState.routeSteps.length) { 
    renderCurrentStep(AppState.currentStep + 1); // 다음 단계 렌더링
    UIManager.toggleRecommendationInfo(false); // 추천 경로 정보 숨김
  } 
  // 모든 세그먼트가 완료된 후 (currentStep이 routeSteps.length와 같을 때)
  if (AppState.currentStep === AppState.routeSteps.length) { 
    // 기존 알림 제거
    // alert("모든 환승이 완료되었습니다."); 
	
	// 마지막 경로에 별점 추가
	const starRatingSection = document.getElementById('starRatingSection');
    if (starRatingSection) {
      starRatingSection.style.display = 'block';
    }
    setupStarRating();
	
    // 화면 하단 모든 요소 숨기기 (노선 제외)
    document.getElementById('busInfo').style.display = 'none';
    document.getElementById('destInfo').style.display = 'none';
    // document.getElementById('progressContainer').style.display = 'none'; // 노선(진행바)은 남김
    document.getElementById('transferBtn').style.display = 'none';
    document.getElementById('transferInstruction').style.display = 'none';
    document.getElementById('listenBtn').style.display = 'none';
    document.getElementById('viewRouteBtn').style.display = 'none';
    document.querySelector('.text-gray-500').style.display = 'none'; // 추천 경로 텍스트도 숨김

    // "저희 타로를 이용해주셔서 감사합니다." 텍스트 표시
    // walkInstruction 엘리먼트를 재활용하여 메시지를 표시합니다.
    // 기존 위치와 다른 스타일로 중앙에 배치
    const walkInstructionEl = document.getElementById('walkInstruction');
    walkInstructionEl.innerHTML = `<p class='text-2xl font-bold text-center mt-8'>목적지에 도착했습니다. <br> 이용해주셔서 감사합니다.</p>`;
    walkInstructionEl.style.marginTop = '4rem'; // 상단 노선과의 간격 조정
    
    UIManager.toggleTransferButtonAndInstruction(false); // '환승' 버튼 및 안내 숨김 (중복이지만 확실히)
    UIManager.toggleRecommendationInfo(false); // 추천 경로 정보 숨김 (중복이지만 확실히)
  }
});

// '듣기' 버튼 클릭 이벤트 리스너
document.getElementById('listenBtn').addEventListener('click', async function() {
    const station = document.getElementById('currentStation').textContent;
    const bus = document.getElementById('busNumber').textContent;
    const dest = document.getElementById('destination').textContent;
    await handleListenButtonClick(this, station, bus, dest); // TTS 로직 호출
});

// 별점 기능 설정 함수
function setupStarRating() {
  const stars = document.querySelectorAll('#starRatingSection .star');
  
  stars.forEach(star => {
    star.addEventListener('click', (e) => {
      const value = e.target.getAttribute('data-value');
      
      // 모든 별의 'active' 클래스 제거
      stars.forEach(s => s.classList.remove('active'));
      
      // 클릭한 별과 그 이전 별들에 'active' 클래스 추가하여 색상 변경
      for (let i = 0; i < value; i++) {
        stars[i].classList.add('active');
      }
      
      console.log(`선택된 별점: ${value}`);
      // 필요한 경우, 이 값을 AppState에 저장하거나 서버로 전송하는 로직을 추가할 수 있습니다.
    });
  });
}

/**
 * 특정 정류장 이미지를 조건에 따라 표시하거나 숨깁니다.
 * @param {object | null} nextSubPath - 다음 경로 단계 객체
 */
function setupImage(nextSubPath) {
  const imageElement = document.getElementById('myImage');
  if (imageElement) {
    // 다음 경로가 존재하고, 버스 경로이며, startArsID가 '09259'일 경우 '센텀시티역.벡스코 광안리방향'
    if (nextSubPath && nextSubPath.trafficType === 2 && nextSubPath.startArsID === '09259') {
      imageElement.src = "/Bexco.png";
      imageElement.style.display = 'block'; // 이미지 활성화
    } 
    // 다음 경로가 존재하고, 버스 경로이며, startArsID가 '09715'일 경우 '동해선.벡스코역 센텀방향'
    else if (nextSubPath && nextSubPath.trafficType === 2 && nextSubPath.startArsID === '09715') {
      imageElement.src = "DongheaBexco.png";
      imageElement.style.display = 'block'; // 이미지 활성화
    } 
    // 위 조건들에 해당하지 않는 모든 경우
    else {
      imageElement.style.display = 'none'; // 이미지 숨김
    }
  }
}
