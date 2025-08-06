// api key 값 호출
import { Gemini } from './api.js';

const GEMINI_API_KEY = Gemini;

/**
   * Gemini API를 호출하여 텍스트에서 도착지를 추출하는 함수
   * @param {string} text - 음성으로 인식된 텍스트
   * @returns {Promise<string|null>} - 추출된 도착지 또는 null
*/
export async function extractDestinationWithGemini(text) {
	const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `
      사용자의 문장에서 '도착지'만 정확하게 추출해줘.
      결과는 반드시 {"destination": "추출된 도착지"} 형식의 JSON으로만 응답해야 해.
      만약 문장에 도착지가 없으면 {"destination": null} 로 응답해줘.

      사용자 문장: "${text}"
    `;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (!response.ok) {
        throw new Error('API 호출 실패: ' + response.statusText);
      }

      const data = await response.json();
      const resultText = data.candidates[0].content.parts[0].text;
      
      // Gemini 응답에서 JSON 부분만 깔끔하게 정리
      const jsonString = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
      const resultJson = JSON.parse(jsonString);

      return resultJson.destination;

    } catch (error) {
      console.error('Gemini API 오류:', error);
      recognitionStatus.textContent = 'AI 모델 호출 중 오류가 발생했습니다.';
      return null; // 오류 발생 시 null 반환
    }
}


