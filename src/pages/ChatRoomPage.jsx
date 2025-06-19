import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

const ChatRoomPage = ({ user, onLogout }) => {
  const { chatRoomId } = useParams();
  const navigate = useNavigate();
  
  // URL 파라미터를 실제 chatRoomIdx로 변환
  const actualChatRoomIdx = (() => {
    // 단순 숫자인 경우 그대로 사용
    if (/^\d+$/.test(chatRoomId)) {
      return parseInt(chatRoomId);
    }
    // 복합 ID인 경우 첫 번째 숫자를 사용 (임시)
    // 실제로는 API를 통해 올바른 ID를 찾아야 함
    const firstNumber = chatRoomId.split('_')[0];
    console.warn("복합 ID 감지:", chatRoomId, "-> 첫 번째 숫자 사용:", firstNumber);
    return parseInt(firstNumber);
  })();
  
  console.log("URL chatRoomId:", chatRoomId);
  console.log("실제 사용할 chatRoomIdx:", actualChatRoomIdx);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const BASE_URL = "http://localhost:8080/api";

  const handleUnauthorized = () => {
    alert("세션이 만료되었습니다. 다시 로그인해주세요.");
    onLogout();
  };

  // 메시지 목록 조회
  const fetchMessages = async () => {
    setLoading(true);
    try {
      console.log("=== 메시지 조회 시작 ===");
      console.log("요청 actualChatRoomIdx:", actualChatRoomIdx);
      console.log("원본 URL chatRoomId:", chatRoomId);
      console.log("현재 사용자 ID:", user.user_idx);
      console.log("API URL:", `${BASE_URL}/chatmsg/${actualChatRoomIdx}`);
      
      const response = await fetch(`${BASE_URL}/chatmsg/${actualChatRoomIdx}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      console.log("메시지 조회 응답 상태:", response.status);

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (response.ok) {
        const data = await response.json();
        console.log("메시지 조회 성공:", data);
        
        const messageList = Array.isArray(data) ? data : 
                           Array.isArray(data.data) ? data.data : [];
        
        setMessages(messageList);
        setError(null);
      } else {
        const errorData = await response.text();
        console.log("API 응답 상태:", response.status);
        
        // 404는 메시지가 없는 것으로 처리 (에러 아님)
        if (response.status === 404) {
          console.log("📝 메시지가 없는 채팅방:", actualChatRoomIdx);
          setMessages([]); // 빈 배열로 설정
          setError(null); // 에러 없음
          return; // 에러로 처리하지 않고 리턴
        }
        
        // 실제 에러만 에러로 처리
        console.error("❌ 메시지 조회 실패:");
        console.error("- 상태 코드:", response.status);
        console.error("- 상태 텍스트:", response.statusText);
        console.error("- 에러 응답:", errorData);
        console.error("- 요청한 actualChatRoomIdx:", actualChatRoomIdx);
        console.error("- 원본 URL chatRoomId:", chatRoomId);
        console.error("- 현재 사용자 ID:", user.user_idx);
        
        if (response.status === 403) {
          setError(`채팅방 접근 권한이 없습니다. (사용자 ID: ${user.user_idx}, 채팅방 ID: ${actualChatRoomIdx})`);
        } else {
          setError(`메시지를 불러올 수 없습니다. (${response.status})`);
        }
      }

    } catch (err) {
      console.error("메시지 조회 중 오류:", err);
      setError("메시지 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 메시지 전송
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    if (sending) return;

    setSending(true);
    try {
      console.log("메시지 전송 시도:", {
        actualChatRoomIdx,
        message: newMessage,
        userId: user.user_idx
      });

      const requestBody = {
        chatRoomIdx: actualChatRoomIdx,
        senderUserIdx: user.user_idx,
        chatMsgContent: newMessage.trim()
      };

      console.log("메시지 전송 요청 데이터:", requestBody);

      const response = await fetch(`${BASE_URL}/chatmsg/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      console.log("메시지 전송 응답 상태:", response.status);

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (response.ok) {
        const data = await response.json();
        console.log("메시지 전송 성공:", data);
        
        setNewMessage("");
        // 메시지 목록 새로고침
        await fetchMessages();
      } else {
        const errorData = await response.text();
        console.error("메시지 전송 실패:", response.status, errorData);
        alert("메시지 전송에 실패했습니다.");
      }

    } catch (err) {
      console.error("메시지 전송 중 오류:", err);
      alert("메시지 전송 중 오류가 발생했습니다.");
    } finally {
      setSending(false);
    }
  };

  // Enter 키로 메시지 전송
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 메시지 목록 끝으로 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 뒤로가기
  const handleGoBack = () => {
    navigate(-1);
  };

  // 날짜 포맷팅
  const formatTime = (dateString) => {
    if (!dateString) return "";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return dateString;
    }
  };

  // 메시지가 내 메시지인지 확인
  const isMyMessage = (message) => {
    return message.senderUserIdx === user.user_idx;
  };

  // 메시지 발신자 이름
  const getSenderName = (message) => {
    return message.senderName || "사용자";
  };

  useEffect(() => {
    if (actualChatRoomIdx) {
      fetchMessages();
    }
  }, [actualChatRoomIdx]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!chatRoomId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">채팅방 ID가 없습니다.</p>
          <button
            onClick={handleGoBack}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleGoBack}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">채팅방</h1>
                <p className="text-sm text-gray-500">
                  {(() => {
                    // chatRoomId가 숫자면 그대로, 복합 ID면 간단하게 표시
                    const isSimpleNumber = /^\d+$/.test(chatRoomId);
                    if (isSimpleNumber) {
                      return `채팅방 ${chatRoomId}번`;
                    } else {
                      // 복합 ID의 경우 첫 번째 숫자만 사용
                      const firstNumber = chatRoomId.split('_')[0];
                      return `채팅방 ${firstNumber}번`;
                    }
                  })()}
                </p>
              </div>
            </div>
            <button
              onClick={fetchMessages}
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
              disabled={loading}
            >
              {loading ? "새로고침 중..." : "새로고침"}
            </button>
          </div>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="max-w-2xl mx-auto space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {loading && messages.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                메시지를 불러오는 중...
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="mb-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.681L3 21l2.319-5.094A7.96 7.96 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                  </svg>
                </div>
                <p>아직 메시지가 없습니다.</p>
                <p className="text-sm mt-1">첫 번째 메시지를 보내보세요!</p>
              </div>
            ) : (
              messages.map((message) => {
                const isMine = isMyMessage(message);
                const senderName = getSenderName(message);
                const messageTime = formatTime(message.chatSendDate);
                const content = message.chatMsgContent || "";

                return (
                  <div
                    key={message.chatMsgIdx || message.id || Math.random()}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-xs lg:max-w-md ${isMine ? "order-2" : "order-1"}`}>
                      {!isMine && (
                        <p className="text-xs text-gray-500 mb-1 px-2">{senderName}</p>
                      )}
                      <div
                        className={`px-4 py-2 rounded-lg ${
                          isMine
                            ? "bg-blue-500 text-white"
                            : "bg-white border border-gray-200 text-gray-900"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isMine ? "text-blue-100" : "text-gray-500"
                          }`}
                        >
                          {messageTime}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* 메시지 입력 영역 */}
        <div className="bg-white border-t px-4 py-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex space-x-3">
              <div className="flex-1">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="메시지를 입력하세요..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows="1"
                  style={{
                    minHeight: "48px",
                    maxHeight: "120px",
                    resize: "none"
                  }}
                  disabled={sending}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  !newMessage.trim() || sending
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                {sending ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  "전송"
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Enter로 전송, Shift+Enter로 줄바꿈
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatRoomPage; 