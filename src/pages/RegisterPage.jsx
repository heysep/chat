import React, { useState } from "react";

const RegisterPage = ({ onRegisterSuccess, onNavigateToLogin }) => {
  const [formData, setFormData] = useState({
    companyName: "",
    userId: "",
    userPw: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const BASE_URL = "http://localhost:8080/api";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError(null);
  };

  const handleRegister = async () => {
    if (
      !formData.companyName.trim() ||
      !formData.userId.trim() ||
      !formData.userPw.trim()
    ) {
      setError("모든 필드를 입력해주세요.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BASE_URL}/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          companyName: formData.companyName,
          userId: formData.userId,
          userPw: formData.userPw,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      if (onRegisterSuccess) onRegisterSuccess();
    } catch (err) {
      console.error("회원가입 실패:", err);
      setError(err.message || "회원가입에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleRegister();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🏢</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">회원가입</h1>
          <p className="text-gray-600">새 계정을 생성하세요</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="space-y-6">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                회사명
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="회사명을 입력하세요"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
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

            <div>
              <label htmlFor="userPw" className="block text-sm font-medium text-gray-700 mb-2">
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

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleRegister}
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
                  <span>가입 중...</span>
                </div>
              ) : (
                "회원가입"
              )}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <button
                onClick={onNavigateToLogin}
                className="text-blue-500 hover:text-blue-600 transition-colors"
              >
                로그인으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
