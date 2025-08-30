// app_config_state.js
// 애플리케이션의 전역 설정과 상태 변수들을 정의합니다.

// API 키는 api.js 파일에서 가져옵니다.
import { ODsay_url, Busan } from './api.js';

export { ODsay_url, Busan }; // 다른 모듈에서 사용 가능하도록 재내보내기 (re-export)

// 애플리케이션의 핵심 상태 변수들
export let currentStep = 0;
export let routeSteps = [];
export let recommendedSteps = [];
export let bestTotalPath = null;
export let recommendedTotalPath = null;
export let bestTotalTime = 0;
export let recommendedTime = 0;
export let isShowingRecommendedRoute = false;

// 음성 합성(TTS) 기능을 제공하는 클라우드 함수의 URL
export const TTS_FUNCTION_URL = 'https://asia-northeast3-taro-461003.cloudfunctions.net/googleTts';

// 상태 변수를 업데이트하는 함수들 (필요한 경우)
// 현재 예제에서는 다른 모듈에서 직접 접근하여 변경합니다.
export function updateRouteSteps(newSteps) {
    routeSteps = newSteps;
}

export function updateCurrentStep(step) {
    currentStep = step;
}

export function updateBestTotalPath(path) {
    bestTotalPath = path;
}

export function updateRecommendedTotalPath(path) {
    recommendedTotalPath = path;
}

export function updateBestTotalTime(time) {
    bestTotalTime = time;
}

export function updateRecommendedTime(time) {
    recommendedTime = time;
}

export function updateIsShowingRecommendedRoute(value) {
    isShowingRecommendedRoute = value;
}
