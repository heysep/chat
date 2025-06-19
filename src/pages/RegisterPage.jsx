import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    companyName: "",
    userId: "",
    userPw: "",
    userName: "",
    businessNum: "",
    startDate: "",
    companyAddress: "",
    companyIndustry: "",
    companyTell: "",
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
      !formData.userPw.trim() ||
      !formData.userName.trim() ||
      !formData.businessNum.trim() ||
      !formData.startDate.trim() ||
      !formData.companyAddress.trim() ||
      !formData.companyIndustry.trim() ||
      !formData.companyTell.trim()
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
          userName: formData.userName,
          businessNum: formData.businessNum,
          startDate: formData.startDate,
          companyAddress: formData.companyAddress,
          companyIndustry: formData.companyIndustry,
          companyTell: formData.companyTell,
          joinApproved: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      alert("회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.");
      navigate('/login');
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

            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-2">
                사용자 이름
              </label>
              <input
                type="text"
                id="userName"
                name="userName"
                value={formData.userName}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="사용자 이름을 입력하세요"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="businessNum" className="block text-sm font-medium text-gray-700 mb-2">
                사업자번호
              </label>
              <input
                type="text"
                id="businessNum"
                name="businessNum"
                value={formData.businessNum}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="사업자번호를 입력하세요"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                시작일
              </label>
              <input
                type="text"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="YYYYMMDD"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700 mb-2">
                회사 주소
              </label>
              <input
                type="text"
                id="companyAddress"
                name="companyAddress"
                value={formData.companyAddress}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="회사 주소를 입력하세요"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="companyIndustry" className="block text-sm font-medium text-gray-700 mb-2">
                업종
              </label>
              <input
                type="text"
                id="companyIndustry"
                name="companyIndustry"
                value={formData.companyIndustry}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="업종을 입력하세요"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="companyTell" className="block text-sm font-medium text-gray-700 mb-2">
                회사 전화번호
              </label>
              <input
                type="text"
                id="companyTell"
                name="companyTell"
                value={formData.companyTell}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="회사 전화번호를 입력하세요"
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
                  <span>회원가입 중...</span>
                </div>
              ) : (
                "회원가입"
              )}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="text-center">
              <Link
                to="/login"
                className="text-blue-500 hover:text-blue-600 transition-colors text-sm"
              >
                이미 계정이 있으신가요? 로그인
              </Link>
            </div>
          </div>
        </div>

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

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            API: POST {BASE_URL}/users/register
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
