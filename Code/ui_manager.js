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
    el.innerHTML = `<p class='text-2xl text-blue-700'>${station}</p>`;
  } else {
    el.innerHTML = `<p class='font-bold text-2xl'> 현재 <span id='currentStation'>${station}</span></p>`;
  }
}

/**
 * 버스 번호와 버스 타입을 설정하고, 버스 타입에 따라 색상을 변경합니다.
 * @param {string} number - 버스 번호
 * @param {string} busType - 버스 타입 (예: '일반버스', '급행버스')
 */
export function setBusNumber(number, busType) {
  const busNumberSpan = document.getElementById('busNumber');
  busNumberSpan.textContent = number + '번';
  
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
      busNumberSpan.classList.add('text-gray-900'); // 기본값
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
  document.getElementById('totalTime').textContent = time + '분';
}

/**
 * 버스 아이콘의 위치를 현재 진행 단계에 맞춰 이동시킵니다.
 * @param {number} step - 현재 진행 단계 (1부터 시작)
 * @param {number} totalDots - 총 진행 점의 개수
 */
export function moveBusIcon(step, totalDots) {
  const busIcon = document.getElementById('busIcon');
  const progressContainer = document.getElementById('progressContainer');

  if (!progressContainer || totalDots === 0) {
    return;
  }

  const containerWidth = progressContainer.offsetWidth;
  const dotWidth = 16; // Use 16px consistent with CSS
  const containerPadding = 16; // This might need adjustment based on final layout

  let targetPixelPosition;

  // If there's only one "dot" (meaning only one step or no bar), center the bus.
  // In our case, totalDots will be routeStepsData.length - 1 if we remove the last dot,
  // Or routeStepsData.length if we keep the last dot for totalDots calculation.
  // Let's assume totalDots here refers to the actual number of visible dots.
  // For the bus to move to the very end of the line, even if the last dot is removed,
  // we need to calculate the end position based on the container width.

  if (totalDots === 1) { // Only one visible dot
    targetPixelPosition = containerWidth / 2;
  } else {
    // Calculate the span from the center of the first dot to the center of the last *potential* dot.
    // Even if the last dot isn't rendered, the line goes to its position.
    const effectiveTotalDots = totalDots; // The actual number of steps, not just visible dots.
    const firstDotCenterPx = containerPadding + (dotWidth / 2);
    // The last point on the line would be at containerWidth - containerPadding - (dotWidth / 2)
    // if there was a dot there.
    const lastPointPx = containerWidth - containerPadding - (dotWidth / 2);
    const totalSpan = lastPointPx - firstDotCenterPx;

    // Calculate position based on the proportion of the total span.
    // If step 1 is the first dot, step `totalDots` is the end of the line.
    targetPixelPosition = firstDotCenterPx + ((step - 1) / (effectiveTotalDots - 1)) * totalSpan;
  }
  
  const finalPercent = (targetPixelPosition / containerWidth) * 100;

  // 초기 위치 설정 시 트랜지션 없이 즉시 이동
  if (!busIcon.dataset.initialPosSet) {
    busIcon.style.transition = 'none';
    busIcon.style.left = `${finalPercent}%`;
    busIcon.offsetWidth; 
    setTimeout(() => {
        busIcon.style.transition = 'transform 0.5s ease-in-out, left 0.5s ease-in-out';
    }, 0); 
    busIcon.dataset.initialPosSet = 'true';
  } else {
    busIcon.style.left = `${finalPercent}%`;
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

  dots.forEach((dot, index) => {
    const baseColor = dot.dataset.baseColor;
    if (baseColor) {
      // 마지막 점은 항상 숨김 (도착지용)
      if (index === dots.length - 1) {
        dot.style.backgroundColor = 'transparent'; // 투명하게
        dot.style.display = 'none'; // 아예 숨김
        return; 
      }

      // 현재 스텝에 해당하는 점과 이전 점들은 진하게
      if (index <= currentStep) {
        dot.style.backgroundColor = baseColor;
      } else {
        // 다음 점들은 연하게
        dot.style.backgroundColor = lightenColor(baseColor, 0.6); // 60% 밝게
      }
    }
  });

  bars.forEach((bar, index) => { 
    const baseColor = bar.dataset.baseColor;
    if (baseColor) {
      // 현재 스텝 이전에 완료된 바는 진하게 (index가 currentStep보다 작을 때)
      if (index < currentStep) { 
        bar.style.backgroundColor = baseColor;
      } else {
        // 현재 스텝에 해당하는 바와 다음 바들은 연하게
        bar.style.backgroundColor = lightenColor(baseColor, 0.6); // 60% 밝게
      }
    }

    const currentTrafficType = bar.dataset.previousTrafficType; 
    const nextTrafficType = bar.dataset.nextTrafficType;     

    // 타입이 같을 때만 오른쪽 겹침 방지 (색상도 같으므로 이어지는 것처럼 보이게)
    if (currentTrafficType === nextTrafficType) {
      bar.classList.add('no-right-overlap');
    } else {
      bar.classList.remove('no-right-overlap'); 
    }
  });
}

/**
 * 경로의 단계 수에 맞춰 진행률 점들을 초기화하고 생성합니다.
 * @param {Array} routeStepsData - 경로의 단계 정보를 담은 배열
 */
export function setupDots(routeStepsData) {
  const container = document.getElementById('progressContainer');
  container.innerHTML = ''; // 기존 점들 제거

  routeStepsData.forEach((stepData, i) => { 
    let dotBaseColor;
    let barBaseColor;

    // 점의 기본 색상 설정
    if (stepData.trafficType == 2) { // 버스
      if (stepData.busType === '일반버스') dotBaseColor = '#0042ED';
      else if (stepData.busType === '급행버스' || stepData.busType === '심야버스(급행)') dotBaseColor = '#FF0000';
      else if (stepData.busType === '마을버스') dotBaseColor = '#008000';
      else dotBaseColor = '#000000'; // Fallback
    } else if (stepData.trafficType == 3) { // 도보
      dotBaseColor = '#A0A0A0';
    } else {
      dotBaseColor = '#000000'; // Fallback
    }

    // 바의 기본 색상은 이전 단계의 교통 타입에 따라 결정
    barBaseColor = dotBaseColor; // 바의 색상은 해당 구간의 시작점과 동일하게

    // 모든 subPath에 대해 점을 생성 (마지막 subPath는 도착지 점)
    const dot = document.createElement('div');
    dot.className = 'progress-dot';
    dot.id = `dot${i}`;
    dot.dataset.trafficType = stepData.trafficType;
    if (stepData.trafficType === 2) {
      dot.dataset.busType = stepData.busType;
    }
    dot.dataset.baseColor = dotBaseColor; // 기본 색상 저장
    container.appendChild(dot);

    // 마지막 점 다음에는 바를 생성하지 않음
    if (i < routeStepsData.length - 1) { 
      const bar = document.createElement('div');
      bar.className = 'progress-bar-segment';
      bar.id = `bar${i}`;
      bar.dataset.previousTrafficType = stepData.trafficType;
      if (stepData.trafficType === 2) {
        bar.dataset.busType = stepData.busType;
      }
      bar.dataset.nextTrafficType = routeStepsData[i + 1].trafficType;
      bar.dataset.baseColor = barBaseColor; // 기본 색상 저장
      
      container.appendChild(bar);
    }
  });
  // 초기 로드 시 모든 점과 선을 연하게 시작하도록 step을 -1로 전달하여 아무것도 진하지 않게 함.
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
        mainContent.style.display = 'none';
    } else {
        loadingOverlay.style.display = 'none';
        mainContent.style.display = 'block';
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
        recommendationTextContainer.innerHTML = `<span id="distanceTime">${distanceText}</span> 거리에 <span id="fasterTime">${fasterTimeText}</span> 빠른 경로가 존재합니다.`;
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