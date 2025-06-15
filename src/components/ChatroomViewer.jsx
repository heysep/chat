import React, { useState, useEffect } from "react";

// 채팅방 컨텍스트
const ChatroomViewer = ({ user, onLogout }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const BASE_URL = "http://localhost:8080/api";
  const CHATROOM_IDX = 8;

  // 메시지 조회 함수
  const fetchMessages = async () => {
    try {
      const response = await fetch(`${BASE_URL}/chatmsg/${CHATROOM_IDX}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // 세션 유지
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const messageData = Array.isArray(data) ? data : [];

      // chatSendDate 기준으로 오름차순 정렬
      const sortedMessages = messageData.sort(
        (a, b) => new Date(a.chatSendDate) - new Date(b.chatSendDate)
      );

      setMessages(sortedMessages);
      setError(null);
      setLastUpdate(new Date());
      console.log("받아온 메시지 데이터:", sortedMessages);
    } catch (err) {
      console.error("메시지 조회 실패:", err);
      setError(`메시지를 불러오는데 실패했습니다: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 초기 로드 및 5초마다 새로고침
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  // 내 메시지인지 판별
  const isMyMessage = (message) => {
    return message.senderUserIdx === user.user_idx;
  };

  // 시간 포맷팅
  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "오늘";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "어제";
    } else {
      return date.toLocaleDateString("ko-KR", {
        month: "long",
        day: "numeric",
      });
    }
  };

  // 날짜 구분선 필요 여부
  const needsDateSeparator = (currentMessage, previousMessage) => {
    if (!previousMessage) return true;
    const currentDate = new Date(currentMessage.chatSendDate);
    const previousDate = new Date(previousMessage.chatSendDate);
    return currentDate.toDateString() !== previousDate.toDateString();
  };

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await fetch(`${BASE_URL}/users/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("로그아웃 실패:", err);
    }
    onLogout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">메시지를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">채팅방</h1>
              <p className="text-sm text-gray-500">
                {user.company_name}님 환영합니다
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-xs text-gray-400">
                채팅방 #{CHATROOM_IDX}
              </div>
              <button
                onClick={handleLogout}
                className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-full hover:bg-red-100 transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 overflow-y-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((message, index) => {
            const isMine = isMyMessage(message);
            const messageText = message.chatMsgContent || "";
            const senderName = message.senderName;
            const showDateSeparator = needsDateSeparator(
              message,
              messages[index - 1]
            );

            return (
              <div key={`${message.chatMsgIdx}-${index}`}>
                {showDateSeparator && (
                  <div className="flex items-center justify-center my-6">
                    <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                      {formatDate(message.chatSendDate)}
                    </div>
                  </div>
                )}

                <div
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex flex-col max-w-xs lg:max-w-md ${
                      isMine ? "items-end" : "items-start"
                    }`}
                  >
                    {!isMine && (
                      <div className="text-xs text-gray-500 mb-1 px-2">
                        {senderName}
                      </div>
                    )}

                    <div
                      className={`px-4 py-3 rounded-2xl shadow-sm ${
                        isMine
                          ? "bg-blue-500 text-white rounded-br-md"
                          : "bg-white text-gray-900 border border-gray-200 rounded-bl-md"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {messageText}
                      </p>
                    </div>

                    <div
                      className={`text-xs text-gray-400 mt-1 px-2 ${
                        isMine ? "text-right" : "text-left"
                      }`}
                    >
                      {formatTime(message.chatSendDate)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {messages.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">💬</div>
            <p className="text-gray-500 text-lg">아직 메시지가 없습니다.</p>
            <p className="text-gray-400 text-sm mt-2">채팅을 시작해보세요!</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-4 right-4 flex flex-col space-y-2">
        <div className="bg-white rounded-full shadow-lg px-3 py-2 flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-600">5초마다 새로고침</span>
        </div>

        <div className="bg-white rounded-lg shadow-lg px-3 py-2 text-xs text-gray-500 text-center">
          마지막 업데이트: {lastUpdate.toLocaleTimeString("ko-KR")}
        </div>
      </div>
    </div>
  );
};

// 로그인 화면
const LoginScreen = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    userId: "",
    userPw: "",
  });
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

// 메인 앱 컴포넌트
const App = () => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 로그인 성공 핸들러
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
  };

  // 로그아웃 핸들러
  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
  };

  return (
    <div>
      {isLoggedIn && user ? (
        <ChatroomViewer user={user} onLogout={handleLogout} />
      ) : (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
};

export default App;
