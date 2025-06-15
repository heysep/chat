import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// 로그인 화면
const LoginPage = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    userId: "",
    userPw: "",
  });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const BASE_URL = "http://localhost:8080/api";

  // 입력값 변경 처리
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // 입력 시 에러 초기화
    if (error) setError(null);
  };

  // 로그인 요청
  const handleLogin = async () => {
    if (!formData.userId.trim() || !formData.userPw.trim()) {
      setError("사용자 ID와 비밀번호를 모두 입력해주세요.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BASE_URL}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // 세션 쿠키 포함
        body: JSON.stringify({
          userId: formData.userId,
          userPw: formData.userPw,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`
        );
      }

      // 로그인 성공 - 상위 컴포넌트에 사용자 정보 전달
      console.log("로그인 성공:", data);
      onLoginSuccess(data.data);
      navigate("/chat");
    } catch (err) {
      console.error("로그인 실패:", err);
      setError(err.message || "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 엔터 키 처리
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* 로고/제목 영역 */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🏢</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            자산 거래 시스템
          </h1>
          <p className="text-gray-600">계정에 로그인하세요</p>
        </div>

        {/* 로그인 폼 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="space-y-6">
            {/* 사용자 ID 입력 */}
            <div>
              <label
                htmlFor="userId"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                사용자 ID
              </label>
              <input
                type="text"
                id="userId"
                name="userId"
                value={formData.userId}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="사용자 ID를 입력하세요"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                disabled={loading}
              />
            </div>

            {/* 비밀번호 입력 */}
            <div>
              <label
                htmlFor="userPw"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                비밀번호
              </label>
              <input
                type="password"
                id="userPw"
                name="userPw"
                value={formData.userPw}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="비밀번호를 입력하세요"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                disabled={loading}
              />
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* 로그인 버튼 */}
            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 ${
                loading
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md"
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>로그인 중...</span>
                </div>
              ) : (
                "로그인"
              )}
            </button>
          </div>

          {/* 추가 링크들 */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <button className="text-blue-500 hover:text-blue-600 transition-colors">
                비밀번호 찾기
              </button>
              <button className="text-blue-500 hover:text-blue-600 transition-colors">
                회원가입
              </button>
            </div>
          </div>
        </div>

        {/* API 상태 표시 */}
        <div className="mt-6 text-center">
          <div className="bg-white rounded-full shadow-sm px-4 py-2 inline-flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                error ? "bg-red-400" : "bg-blue-400"
              } ${loading ? "animate-pulse" : ""}`}
            ></div>
            <span className="text-xs text-gray-600">
              {error ? "API 연결 실패" : "API 준비됨"}
            </span>
          </div>
        </div>

        {/* 개발자 정보 */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            API: POST {BASE_URL}/users/login
          </p>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
