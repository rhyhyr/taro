// ui_manager.js
// 사용자 인터페이스(UI) 제어 및 시각화 기능을 담당합니다.

/**
 * 현재 정류장/위치 안내 문구를 설정합니다.
 * @param {string} station - 표시할 정류장/위치 이름
 * @param {boolean} isWalk - 도보 안내 여부 (true면 파란색 강조)
 */
export function setCurrentStation(station, isWalk = false) {
  const el = document.getElementById('walkInstruction');
  if (isWalk) {
    el.innerHTML = `<p class='text-2xl mb-10'>${station}</p>`;
  } else {
    el.innerHTML = `<p class='font-bold text-2xl'> 현재 <span id='currentStation'>${station}</span></p>`;
  }
}

/**
 * 버스 번호와 버스 타입을 설정하고, 버스 타입에 따라 색상을 변경합니다.
 * @param {string} number - 버스 번호
 * @param {string} busType - 버스 타입 (예: '일반버스', '급행버스')
 */
export function setBusNumber(number, busType, min1) {
  const busInfoContainer = document.getElementById('busInfo');

  // 도착 정보 텍스트를 생성합니다.
  const arrivalText = min1 !== null ? `${min1}분 뒤에 도착하는` : `도착 정보 없음`;

  // busInfoContainer 내부의 기존 내용을 모두 제거합니다.
  busInfoContainer.innerHTML = '';

  // 새로운 HTML 구조를 생성합니다.
  // 줄바꿈을 위해 <br> 태그를 사용합니다.
  const newBusInfo = document.createElement('p');
  newBusInfo.className = 'text-4xl font-bold';
  newBusInfo.innerHTML = `<div id='arrTime'>${arrivalText}</div><span id="busNumber" class="bus-number-color">${number}번</span> 승차`;

  // 생성된 요소를 컨테이너에 추가합니다.
  busInfoContainer.appendChild(newBusInfo);

  const busNumberSpan = document.getElementById('busNumber');
  // busType에 따라 색상을 변경하는 기존 로직은 여기에 그대로 둡니다.
  busNumberSpan.classList.remove('text-blue-600', 'text-red-600', 'text-green-600', 'text-gray-900', 'bus-number-color');

  switch (busType) {
    case '일반버스':
      busNumberSpan.classList.add('text-blue-600');
      break;
    case '급행버스':
    case '심야버스(급행)':
      busNumberSpan.classList.add('text-red-600');
      break;
    case '마을버스':
      busNumberSpan.classList.add('text-green-600');
      break;
    default:
      busNumberSpan.classList.add('text-gray-900');
      break;
  }
}

/**
 * 도착지 안내 문구를 설정합니다.
 * @param {string} dest - 표시할 도착지 이름
 */
export function setDestination(dest) {
  document.getElementById('destination').textContent = dest;
}

/**
 * 총 소요 시간을 설정합니다.
 * @param {number} time - 총 소요 시간 (분)
 */
export function setTotalTime(time) {
  let formattedTime;
  
  if (time < 60) {
    formattedTime = `${time}분`;
  } else {
    const hours = Math.floor(time / 60);
    const minutes = time % 60;
    
    if (minutes === 0) {
      formattedTime = `${hours}시간`;
    } else {
      formattedTime = `${hours}시간 ${minutes}분`;
    }
  }

  document.getElementById('totalTime').textContent = `총 소요시간: ${formattedTime}`;
}


/**
 * 버스 아이콘의 위치를 현재 진행 단계에 맞춰 이동시킵니다.
 * @param {number} step - 현재 진행 단계 (0부터 시작, 완료된 세그먼트 인덱스)
 * @param {number} totalSegments - 총 경로 세그먼트 수 (routeSteps.length)
 */
export function moveBusIcon(step, totalSegments) {
  const busIcon = document.getElementById('busIcon');
  const progressContainer = document.getElementById('progressContainer');

  if (!progressContainer || totalSegments === 0) {
    // 세그먼트가 없으면 시작점에 버스 아이콘을 배치하거나 숨김
    if (totalSegments === 0) {
      busIcon.style.left = '50%'; // 중앙에 배치
      busIcon.style.transform = 'translateX(-50%)';
      busIcon.dataset.initialPosSet = 'true';
    }
    return;
  }

  const containerWidth = progressContainer.offsetWidth;
  const dotWidth = 16; // CSS와 일관된 점 너비
  const containerPadding = 16; // 컨테이너 패딩 (양쪽)

  let targetPixelPosition;
  
  // 첫 번째 점의 중심 (시작점)
  const firstPointPx = containerPadding + (dotWidth / 2);
  // 프로그레스 바의 전체 길이 (시작점 중앙 ~ 마지막 바의 끝)
  const progressBarVisualWidth = containerWidth - (2 * containerPadding); // 양쪽 패딩 제외
  
  if (totalSegments === 0) {
    targetPixelPosition = containerWidth / 2; // 세그먼트가 없으면 중앙
  } else {
    // 이동해야 할 전체 거리는 첫 번째 점의 중심부터 마지막 바의 끝까지입니다.
    // 이는 (컨테이너 전체 폭 - 양쪽 패딩)에 해당합니다.
    const totalTravelDistance = progressBarVisualWidth - (dotWidth / 2); // 첫 점의 중심에서 마지막 바의 끝까지
    
    // 현재 단계까지의 진행 비율 (0 ~ 1)
    // step은 0부터 totalSegments까지 가능 (totalSegments는 모든 세그먼트 완료 상태)
    let progressRatio = step / totalSegments;
    
    // 최종 위치 계산: 첫 점의 중심 + (진행 비율 * 총 이동 거리)
    targetPixelPosition = firstPointPx + (progressRatio * totalTravelDistance);
  }
  
  // 버스 아이콘의 중앙이 targetPixelPosition에 오도록 translateX(-50%)를 함께 적용
  const finalPercent = (targetPixelPosition / containerWidth) * 100;

  // 초기 위치 설정 시 트랜지션 없이 즉시 이동
  if (!busIcon.dataset.initialPosSet) {
    busIcon.style.transition = 'none';
    busIcon.style.left = `${finalPercent}%`;
    busIcon.style.transform = 'translateX(-50%)'; // 중앙 정렬
    busIcon.offsetWidth; // 강제 리플로우
    setTimeout(() => {
        busIcon.style.transition = 'transform 0.5s ease-in-out, left 0.5s ease-in-out';
    }, 0); 
    busIcon.dataset.initialPosSet = 'true';
  } else {
    busIcon.style.left = `${finalPercent}%`;
    busIcon.style.transform = 'translateX(-50%)'; // 중앙 정렬
  }
}


/**
 * RGB 색상 문자열을 받아서 지정된 비율만큼 밝게 만듭니다.
 * @param {string} color - 'rgb(R, G, B)' 또는 '#RRGGBB' 형태의 색상 문자열
 * @param {number} percent - 밝게 만들 비율 (예: 0.5는 50% 밝게)
 * @returns {string} - 밝게 조정된 'rgb(R, G, B)' 형태의 색상 문자열
 */
function lightenColor(color, percent) {
    let r, g, b;

    // Hex to RGB
    if (color.startsWith('#')) {
        r = parseInt(color.substring(1, 3), 16);
        g = parseInt(color.substring(3, 5), 16);
        b = parseInt(color.substring(5, 7), 16);
    } 
    // RGB string to RGB values
    else if (color.startsWith('rgb')) {
        const parts = color.match(/\d+/g).map(Number);
        [r, g, b] = parts;
    } else {
        return color; // Return as is if format is unrecognized
    }

    r = Math.min(255, r + (255 - r) * percent);
    g = Math.min(255, g + (255 - g) * percent);
    b = Math.min(255, b + (255 - b) * percent);

    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

/**
 * 진행률 점들의 색상을 업데이트하여 현재 단계를 시각적으로 표시합니다.
 * @param {number} currentStep - 현재 진행 단계 인덱스 (0부터 시작)
 */
export function updateProgressDots(currentStep) {
  const dots = document.querySelectorAll('.progress-dot');
  const bars = document.querySelectorAll('.progress-bar-segment');

  // 점들의 색상 업데이트
  dots.forEach((dot, index) => {
    const baseColor = dot.dataset.baseColor;
    if (baseColor) {
      // currentStep은 현재 완료된 '세그먼트'의 인덱스입니다.
      // dot0은 시작점, dot1은 bar0의 끝점, dot2는 bar1의 끝점 등
      // index는 점의 번호 (0, 1, 2, ...)
      // currentStep이 0이면 dot0만 진하게
      // currentStep이 1이면 dot0, dot1 진하게
      // currentStep이 N이면 dot0 ~ dotN 진하게
      if (index <= currentStep) { 
        dot.style.backgroundColor = baseColor;
      } else {
        dot.style.backgroundColor = lightenColor(baseColor, 0.6);
      }
      dot.style.display = 'block'; // 모든 점을 보이게 설정
    }
  });

  // 바들의 색상 업데이트
  bars.forEach((bar, index) => { 
    const baseColor = bar.dataset.baseColor;
    const timeLabel = bar.querySelector('.time-label');
    let isLightened = false;

    if (baseColor) {
      // 바는 해당 인덱스의 세그먼트를 나타내므로, currentStep보다 작으면 진하게 칠합니다.
      // currentStep에 해당하는 바는 진행 중이거나 아직 완료되지 않은 것으로 간주하여 연하게
      if (index < currentStep) { 
        bar.style.backgroundColor = baseColor;
        isLightened = false;
      } else {
        bar.style.backgroundColor = lightenColor(baseColor, 0.6);
        isLightened = true;
      }
    }

    if (timeLabel) {
      timeLabel.textContent = `${bar.dataset.sectionTime}분`; // 바의 data-section-time 사용
      if (isLightened) {
        timeLabel.classList.add('lightened');
      } else {
        timeLabel.classList.remove('lightened');
      }
    }

    const currentTrafficType = bar.dataset.previousTrafficType;
    const nextTrafficType = bar.dataset.nextTrafficType;    

    // 타입이 같을 때만 오른쪽 겹침 방지 (색상도 같으므로 이어지는 것처럼 보이게)
    if (currentTrafficType == nextTrafficType) { // 숫자 비교를 위해 '==' 사용
      bar.classList.add('no-right-overlap');
    } else {
      bar.classList.remove('no-right-overlap');
    }
  });
}

/**
 * 경로의 단계 수에 맞춰 진행률 점들을 초기화하고 생성합니다.
 * @param {Array} routeStepsData - 경로의 단계 정보를 담은 배열 (각 요소는 하나의 세그먼트)
 */
export function setupDots(routeStepsData) { 
  const container = document.getElementById('progressContainer');
  container.innerHTML = ''; // 기존 점들 제거

  // 헬퍼 함수: 트래픽 타입과 버스 타입에 따라 기본 색상 결정
  function getBaseColorForTrafficType(trafficType, busType) {
      if (trafficType == 2) { // 버스
          if (busType === '일반버스') return '#1d4ed8';
          else if (busType === '급행버스' || busType === '심야버스(급행)') return '#FF0000';
          else if (busType === '마을버스') return '#008000';
          else return '#000000'; // Fallback
      } else if (trafficType == 3) { // 도보
          return '#A0A0A0'; // 도보 색상 (회색)
      } else {
          return '#000000'; // Fallback
      }
  }

  // 1. 첫 번째 시작 점 (dot0) 생성
  const initialDot = document.createElement('div');
  initialDot.className = 'progress-dot';
  initialDot.id = 'dot0';
  
  // dot0의 색상은 첫 번째 경로 세그먼트의 교통 유형을 따르거나 기본값 (도보 회색)
  let initialDotColor = '#A0A0A0'; 
  if (routeStepsData.length > 0) {
      initialDotColor = getBaseColorForTrafficType(routeStepsData[0].trafficType, routeStepsData[0].busType);
  }
  initialDot.dataset.baseColor = initialDotColor;
  container.appendChild(initialDot);

  // 2. 각 경로 세그먼트(subPath)에 대해 선(bar)과 다음 점(dot) 생성
  // 총 N개의 세그먼트에 대해 N개의 bar와 (N-1)개의 중간 점
  routeStepsData.forEach((stepData, i) => {
    // 현재 세그먼트의 색상 결정 (bar의 색상)
    let segmentColor = getBaseColorForTrafficType(stepData.trafficType, stepData.busType);

    // 선 (progress-bar-segment) 생성
    const bar = document.createElement('div');
    bar.className = 'progress-bar-segment';
    bar.id = `bar${i}`; // bar0 for segment0, bar1 for segment1, etc.
    bar.dataset.previousTrafficType = stepData.trafficType;
    // 다음 교통 수단 유형을 설정하여 선의 연결 상태를 결정 (마지막 바는 현재 타입 유지)
    bar.dataset.nextTrafficType = (i < routeStepsData.length - 1) ? routeStepsData[i + 1].trafficType : stepData.trafficType;
    bar.dataset.baseColor = segmentColor;
    bar.dataset.sectionTime = stepData.sectionTime; // 해당 경로 세그먼트의 소요 시간 할당

    // 소요 시간 텍스트 라벨 생성 및 추가
    const timeLabel = document.createElement('div');
    timeLabel.className = 'time-label';
    bar.appendChild(timeLabel);
    container.appendChild(bar);

    // 마지막 세그먼트가 아니라면 다음 점 생성 (현재 세그먼트의 끝점)
    // N개의 세그먼트에 (N-1)개의 중간 점을 가집니다. (dot0 포함 시 총 N개의 점)
    // 이 루프에서 dot1부터 dotN-1까지 생성
    if (i < routeStepsData.length - 1) { 
        const dot = document.createElement('div');
        dot.className = 'progress-dot';
        dot.id = `dot${i + 1}`; // 점 ID는 1부터 시작 (첫 점이 0)
        
        // 이 점은 bar[i]의 끝점을 의미하며, 다음 세그먼트(bar[i+1])의 시작점을 나타내므로,
        // 다음 세그먼트의 색상을 점의 색상으로 설정합니다.
        let dotColor = getBaseColorForTrafficType(routeStepsData[i + 1].trafficType, routeStepsData[i + 1].busType);
        
        dot.dataset.baseColor = dotColor; 
        container.appendChild(dot);
    }
  });

  // 초기 로드 시 모든 점과 선을 연하게 시작하도록 currentStep을 -1로 전달
  updateProgressDots(-1); 
}

/**
 * 로딩 오버레이를 표시하거나 숨깁니다.
 * @param {boolean} show - true면 표시, false면 숨김
 */
export function toggleLoadingOverlay(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    const mainContent = document.getElementById('mainContent');
    if (show) {
        loadingOverlay.style.display = 'flex';
        // mainContent에서 .visible 클래스를 제거하여 숨김
        mainContent.classList.remove('visible');
    } else {
        loadingOverlay.style.display = 'none';
        // mainContent에 .visible 클래스를 추가하여 표시
        mainContent.classList.add('visible');
    }
}

/**
 * '환승' 버튼과 '하차 후 환승 누르세요' 지시문의 표시 여부를 제어합니다.
 * @param {boolean} show - true면 표시, false면 숨김
 */
export function toggleTransferButtonAndInstruction(show) {
    const transferBtn = document.getElementById('transferBtn');
    const transferInstruction = document.getElementById('transferInstruction');
    if (show) {
        transferBtn.style.display = 'block';
        if (transferInstruction) {
            transferInstruction.style.display = 'block';
        }
    } else {
        transferBtn.style.display = 'none';
        if (transferInstruction) {
            transferInstruction.style.display = 'none';
        }
    }
}

/**
 * 추천 경로 관련 정보(거리, 시간) 및 '경로 보기' 버튼의 표시 여부를 제어합니다.
 * @param {boolean} show - true면 표시, false면 숨김
 * @param {string} distanceText - 거리에 대한 텍스트
 * @param {string} fasterTimeText - 더 빠른 시간에 대한 텍스트
 */
export function toggleRecommendationInfo(show, distanceText = '', fasterTimeText = '') {
    const recommendationTextContainer = document.querySelector('.text-gray-500');
    const viewRouteBtn = document.getElementById('viewRouteBtn');

    if (show) {
        if (distanceText === '0m') {
            recommendationTextContainer.innerHTML = `같은 정류장에 <span id="fasterTime">${fasterTimeText}</span> 빠른 경로가 존재합니다.`;
        } else {
            recommendationTextContainer.innerHTML = `<span id="distanceTime">${distanceText}</span> 거리에 <span id="fasterTime">${fasterTimeText}</span> 빠른 경로가 존재합니다.`;
        }
        recommendationTextContainer.style.display = 'block';
        viewRouteBtn.style.display = 'block';
    } else {
        recommendationTextContainer.style.display = 'none';
        viewRouteBtn.style.display = 'none';
    }
}

/**
 * '경로 보기' 버튼의 텍스트를 업데이트합니다.
 * @param {string} text - 버튼에 표시할 텍스트
 */
export function setViewRouteButtonText(text) {
    document.getElementById('viewRouteBtn').textContent = text;
}

/**
 * 버스 번호 앞에 도착 정보를 추가하는 함수
 * @param {string} busNumber - 버스 번호 (예: '68')
 * @param {number} min1 - 첫 번째 버스의 도착 예정 시간 (분)
 */
export function setBusArrivalInfo(busNumber, min1) {
  const busNumberElement = document.getElementById('busNumber');
  if (busNumberElement) {
    // 기존의 '68번' 텍스트를 제거
    busNumberElement.textContent = '';
    // '68번 승차' 텍스트를 담을 span 요소를 생성
    const busTextSpan = document.createElement('span');
    busTextSpan.textContent = busNumber + '번 승차';

    // 도착 정보 텍스트를 생성
    const arrivalInfoText = `${min1}분 뒤에 도착하는 `;
    
    // 버스 번호 요소에 도착 정보와 버스 텍스트를 삽입
    busNumberElement.before(arrivalInfoText);
    busNumberElement.after(busTextSpan); // 또는 원하는 위치에 따라 조정
  }
}