// main_app.js
// 애플리케이션의 메인 로직, 사용자 상호작용 및 흐름 관리, TTS 연동을 담당합니다.

// 필요한 모듈들을 가져옵니다.
import * as AppState from './app_config_state.js'; // 전역 상태 및 설정
import * as PathProcessor from './path_processor.js'; // 경로 데이터 처리 로직
import * as UIManager from './ui_manager.js'; // UI 제어 로직

/**
 * 특정 경로 단계를 렌더링하고 UI를 업데이트합니다.
 * @param {number} stepIndex - 렌더링할 경로 단계의 인덱스
 */
function renderCurrentStep(stepIndex) {
  if (stepIndex >= AppState.routeSteps.length) return;

  AppState.updateCurrentStep(stepIndex); // 현재 단계 업데이트

  // 버스 아이콘은 이동할 다음 점을 가리키므로 AppState.currentStep + 1
  UIManager.moveBusIcon(AppState.currentStep + 1, AppState.routeSteps.length); // 버스 아이콘 이동
  // 점과 선의 색상은 현재 진행 중인 스텝까지 진하게 표시 (0부터 시작하는 인덱스)
  UIManager.updateProgressDots(AppState.currentStep); 

  const sub = AppState.routeSteps[AppState.currentStep]; // 현재 단계의 상세 정보

  if (sub.trafficType === 2) { // 대중교통 (버스)
    UIManager.setCurrentStation(sub.startName);
    UIManager.setDestination(sub.endName);
    UIManager.setBusNumber(sub.lane[0].busNo, sub.busType);
    document.getElementById('busInfo').style.display = 'block';
    document.getElementById('destInfo').style.display = 'block';
    document.getElementById('listenBtn').style.display = 'inline-block';
    document.getElementById('transferBtn').innerText = '환승';

    const transferBtn = document.getElementById('transferBtn');
    transferBtn.classList.remove('w-full');
    transferBtn.classList.add('flex-1');

  } else if (sub.trafficType === 3) { // 도보
    const next = AppState.routeSteps[stepIndex + 1];
    UIManager.setCurrentStation(`<span class="overall-bold">${sub.distance}m 거리에 있는 <span class="highlight-station">${next?.startName || '다음 정류장'}</span>(으)로 가세요.</span>`, true);
    document.getElementById('busInfo').style.display = 'none';
    document.getElementById('destInfo').style.display = 'none';
    document.getElementById('listenBtn').style.display = 'none';
    document.getElementById('transferBtn').innerText = '도착';
    document.getElementById('transferInstruction').innerText = '이동 후, 도착을 누르세요';

    const transferBtn = document.getElementById('transferBtn');
    transferBtn.classList.remove('flex-1');
    transferBtn.classList.add('w-full');
  }

  // '환승' 버튼 및 지시문 표시/숨김 로직
  const hasNextStep = AppState.currentStep < AppState.routeSteps.length - 1;
  UIManager.toggleTransferButtonAndInstruction(hasNextStep);
}

/**
 * 계산된 경로 정보를 UI에 적용하여 표시합니다.
 * @param {object} path - 적용할 경로 데이터 객체
 */
function applyRoute(path) {
  const filteredSubPaths = PathProcessor.filterAndPrepareRouteSteps(path);

  UIManager.setTotalTime(path.info.totalTime); // 총 소요 시간 설정
  AppState.updateRouteSteps(filteredSubPaths); // 필터링된 경로 단계 저장
  UIManager.setupDots(AppState.routeSteps); // 진행률 점 다시 설정 (여기서 updateProgressDots(-1) 호출되어 모든 점과 선이 연하게 초기화됨)
  renderCurrentStep(0); // 첫 번째 단계 렌더링 (여기서 updateProgressDots(0) 호출되어 첫 단계만 진해짐)

  // '환승' 버튼 및 지시문 표시/숨김 로직
  const hasNextStep = AppState.routeSteps.length > 0 && AppState.currentStep < AppState.routeSteps.length - 1;
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
  if (!AppState.ODsay_ip || !AppState.Busan) {
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
  if (AppState.currentStep < AppState.routeSteps.length - 1) { // 다음 단계가 남아있으면
    renderCurrentStep(AppState.currentStep + 1); // 다음 단계 렌더링
    UIManager.toggleRecommendationInfo(false); // 추천 경로 정보 숨김
  } else { // 모든 환승이 완료된 경우
    alert("모든 환승이 완료되었습니다.");
    UIManager.toggleTransferButtonAndInstruction(false); // '환승' 버튼 및 안내 숨김
    UIManager.toggleRecommendationInfo(false);
  }
});

// '듣기' 버튼 클릭 이벤트 리스너
document.getElementById('listenBtn').addEventListener('click', async function() {
    const station = document.getElementById('currentStation').textContent;
    const bus = document.getElementById('busNumber').textContent;
    const dest = document.getElementById('destination').textContent;
    await handleListenButtonClick(this, station, bus, dest); // TTS 로직 호출
});