import React, { useState, useEffect, useRef } from "react";

const ChatRoom = ({ user, onLogout }) => {
  const initialChatRoomIdx = (() => {
    const stored = localStorage.getItem("chatRoomIdx");
    return stored ? Number(stored) : null;
  })();

  const [chatRoomIdx, setChatRoomIdx] = useState(initialChatRoomIdx);
  const [chatRooms, setChatRooms] = useState([]); // 채팅방 목록
  const [loadingChatRooms, setLoadingChatRooms] = useState(true); // 채팅방 목록 로딩
  const [messages, setMessages] = useState(() => {
    const stored = localStorage.getItem(`messages_${initialChatRoomIdx}`);
    return stored ? JSON.parse(stored) : [];
  });
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const messagesEndRef = useRef(null);
  const intervalRef = useRef(null);

  const BASE_URL = "http://localhost:8080/api";

  useEffect(() => {
    if (chatRoomIdx) {
    localStorage.setItem("chatRoomIdx", chatRoomIdx);
    }
  }, [chatRoomIdx]);

  // 채팅방 목록 조회
  const fetchChatRooms = async () => {
    try {
      console.log("=== 채팅방 목록 조회 시작 ===");
      console.log("사용자 ID:", user.user_idx);
      console.log("API URL:", `${BASE_URL}/chatroom/list/${user.user_idx}`);
      
      const response = await fetch(`${BASE_URL}/chatroom/list/${user.user_idx}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      console.log("=== API 응답 정보 ===");
      console.log("응답 상태:", response.status);
      console.log("응답 상태 텍스트:", response.statusText);
      console.log("응답 헤더:", Object.fromEntries(response.headers.entries()));

      if (response.status === 401) {
        console.error("❌ 인증 오류 (401) - 세션 만료");
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ 채팅방 목록 조회 실패:");
        console.error("- 상태 코드:", response.status);
        console.error("- 상태 텍스트:", response.statusText);
        console.error("- 에러 응답:", errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log("=== API 응답 데이터 분석 ===");
      console.log("전체 응답 데이터:", data);
      console.log("API 성공 여부:", data.success);
      console.log("API 메시지:", data.message);
      
      // ApiResponse 구조에 맞게 데이터 추출 (data.data가 채팅방 배열)
      const chatRoomData = data.success && Array.isArray(data.data) ? data.data : [];

      console.log("=== 추출된 채팅방 데이터 ===");
      console.log("추출된 채팅방 배열:", chatRoomData);
      console.log("채팅방 개수:", chatRoomData.length);
      
      if (chatRoomData.length > 0) {
        console.log("채팅방 목록 상세:");
        chatRoomData.forEach((room, index) => {
          console.log(`=== 채팅방 ${index + 1} 상세 정보 ===`);
          console.log("실제 채팅방 ID (chatRoomIdx):", room.chatRoomIdx);
          console.log("거래 ID (transactionIdx):", room.transactionIdx);
          console.log("상품 ID (productIdx):", room.productIdx);
          console.log("구매자 ID (buyerUserIdx):", room.buyerUserIdx);
          console.log("판매자 ID (sellerUserIdx):", room.sellerUserIdx);
          console.log("생성일:", room.createdAt);
          console.log("마지막 메시지:", room.lastMessage);
          
          // 내가 구매자인지 판매자인지 확인
          const isBuyer = room.buyerUserIdx === user.user_idx;
          const isSeller = room.sellerUserIdx === user.user_idx;
          const counterpartId = isBuyer ? room.sellerUserIdx : room.buyerUserIdx;
          
          console.log("내 역할:", isBuyer ? "구매자" : "판매자");
          console.log("상대방 ID:", counterpartId);
          console.log("전체 채팅방 데이터:", room);
        });
      } else {
        console.log("⚠️ 채팅방이 없습니다.");
      }

      setChatRooms(chatRoomData);
      
      // 첫 번째 채팅방을 기본 선택 (기존에 저장된 것이 없거나 목록에 없으면)
      if (chatRoomData.length > 0) {
        // 저장된 chatRoomIdx가 현재 목록에 있는지 확인
        const savedRoomExists = chatRoomIdx && chatRoomData.some(room => room.chatRoomIdx === chatRoomIdx);
        
        if (!savedRoomExists) {
          const firstChatRoomIdx = chatRoomData[0].chatRoomIdx;
          console.log("=== 첫 번째 채팅방 자동 선택 ===");
          console.log("선택된 채팅방 ID:", firstChatRoomIdx);
          setChatRoomIdx(firstChatRoomIdx);
        } else {
          console.log("=== 기존 선택된 채팅방 유지 ===");
          console.log("현재 채팅방 ID:", chatRoomIdx);
        }
      }
      
      console.log("✅ 채팅방 목록 설정 완료");
      console.log("=== 채팅방 목록 조회 종료 ===");
      
    } catch (err) {
      console.error("❌ 채팅방 목록 조회 중 오류 발생:");
      console.error("오류 이름:", err.name);
      console.error("오류 메시지:", err.message);
      console.error("오류 스택:", err.stack);
      setError(`채팅방 목록을 불러오는데 실패했습니다: ${err.message}`);
    } finally {
      setLoadingChatRooms(false);
      console.log("채팅방 목록 로딩 완료");
    }
  };

  // 메시지 조회 함수
  const handleUnauthorized = () => {
    alert("세션이 만료되었습니다. 다시 로그인해주세요.");
    onLogout();
  };

  const fetchMessages = async () => {
    if (!chatRoomIdx) return; // 채팅방이 선택되지 않았으면 메시지 조회 안함
    
    // 권한 검증: 현재 사용자가 참여중인 채팅방인지 확인
    const currentRoom = chatRooms.find(room => room.chatRoomIdx === chatRoomIdx);
    if (!currentRoom) {
      console.error("❌ 권한 없는 채팅방 접근 시도:", chatRoomIdx);
      setError("접근 권한이 없는 채팅방입니다.");
      return;
    }
    
    // 사용자가 구매자 또는 판매자인지 확인
    const hasPermission = currentRoom.buyerUserIdx === user.user_idx || 
                         currentRoom.sellerUserIdx === user.user_idx;
    if (!hasPermission) {
      console.error("❌ 채팅방 참여자가 아님:", {
        chatRoomIdx,
        userId: user.user_idx,
        buyerUserIdx: currentRoom.buyerUserIdx,
        sellerUserIdx: currentRoom.sellerUserIdx
      });
      setError("해당 채팅방의 참여자가 아닙니다.");
      return;
    }
    
    try {
      console.log("=== 메시지 조회 시작 ===");
      console.log("요청 chatRoomIdx:", chatRoomIdx);
      console.log("현재 사용자 ID:", user.user_idx);
      console.log("API URL:", `${BASE_URL}/chatmsg/${chatRoomIdx}`);
      
      // 현재 선택된 채팅방 정보 확인
      const currentRoom = chatRooms.find(room => room.chatRoomIdx === chatRoomIdx);
      if (currentRoom) {
        console.log("선택된 채팅방 정보:", currentRoom);
        console.log("구매자 ID:", currentRoom.buyerUserIdx);
        console.log("판매자 ID:", currentRoom.sellerUserIdx);
        console.log("내가 구매자인가?:", currentRoom.buyerUserIdx === user.user_idx);
        console.log("내가 판매자인가?:", currentRoom.sellerUserIdx === user.user_idx);
      } else {
        console.warn("⚠️ 채팅방 목록에서 해당 ID를 찾을 수 없음:", chatRoomIdx);
        console.warn("현재 채팅방 목록:", chatRooms);
      }
      
      const response = await fetch(`${BASE_URL}/chatmsg/${chatRoomIdx}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        cache: "no-store",
        credentials: "include",
      });

      console.log("메시지 조회 응답 상태:", response.status);

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.log("API 응답 상태:", response.status);
        
        // 404는 메시지가 없는 것으로 처리 (에러 아님)
        if (response.status === 404) {
          console.log("📝 메시지가 없는 채팅방:", chatRoomIdx);
          setMessages([]); // 빈 배열로 설정
          setError(null); // 에러 없음
          setLastUpdate(new Date());
          return; // 에러로 처리하지 않고 리턴
        }
        
        // 401, 403 같은 실제 에러만 에러로 처리
        console.error("❌ 메시지 조회 실패:");
        console.error("- 상태 코드:", response.status);
        console.error("- 상태 텍스트:", response.statusText);
        console.error("- 에러 응답:", errorText);
        console.error("- 요청한 chatRoomIdx:", chatRoomIdx);
        console.error("- 현재 사용자 ID:", user.user_idx);
        
        // 403 권한 오류인 경우 특별 처리
        if (response.status === 403) {
          console.error("🚫 권한 오류 상세 분석:");
          const currentRoom = chatRooms.find(room => room.chatRoomIdx === chatRoomIdx);
          if (currentRoom) {
            console.error("채팅방 정보:", currentRoom);
            console.error("구매자 여부:", currentRoom.buyerUserIdx === user.user_idx);
            console.error("판매자 여부:", currentRoom.sellerUserIdx === user.user_idx);
          }
        }
        
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log("받아온 메시지 응답:", data);

      // ApiResponse 구조에 맞게 데이터 추출
      const messageData = Array.isArray(data) ? data : 
                         Array.isArray(data.data) ? data.data : [];

      // chatSendDate 기준으로 오름차순 정렬
      const sortedMessages = messageData.sort(
        (a, b) => new Date(a.chatSendDate) - new Date(b.chatSendDate)
      );

      setMessages(sortedMessages);
      localStorage.setItem(
        `messages_${chatRoomIdx}`,
        JSON.stringify(sortedMessages)
      );
      setError(null);
      setLastUpdate(new Date());
      console.log("정렬된 메시지 데이터:", sortedMessages);
    } catch (err) {
      console.error("메시지 조회 실패:", err);
      setError(`메시지를 불러오는데 실패했습니다: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 메시지 전송
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    if (sending) return;
    if (!chatRoomIdx) return; // 채팅방이 선택되지 않았으면 전송 안함

    setSending(true);
    try {
      console.log("메시지 전송 시도:", {
        chatRoomIdx,
        message: newMessage,
        userId: user.user_idx
      });

      const requestBody = {
        transactionIdx: Number(transactionIdx),
        buyerUserIdx: Number(buyerUserIdx),
        productIdx: Number(productIdx),
        sellerUserIdx: Number(sellerUserIdx),
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
        // 메시지 전송 후 즉시 메시지 목록 새로고침
        await fetchMessages();
        scrollToBottom();
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

  // 채팅방 변경 시 처리
  const handleChatRoomChange = (newChatRoomIdx) => {
    console.log("채팅방 변경:", chatRoomIdx, "->", newChatRoomIdx);
    setChatRoomIdx(Number(newChatRoomIdx));
    
    // 새 채팅방의 메시지를 로컬스토리지에서 불러오기
    const stored = localStorage.getItem(`messages_${newChatRoomIdx}`);
    if (stored) {
      setMessages(JSON.parse(stored));
    } else {
      setMessages([]);
    }
    setLoading(true);
  };

  // 현재 사용자 정보 다시 확인
  const fetchCurrentUser = async () => {
    try {
      console.log("현재 사용자 정보 재조회 시도...");
      const response = await fetch(`${BASE_URL}/users/me`, {
        method: "GET",
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("현재 사용자 정보 응답:", data);
        
        // 로컬 user 객체와 서버 응답 비교
        const serverUserIdx = data.data?.user_idx;
        console.log("서버에서 받은 user_idx:", serverUserIdx);
        console.log("로컬 user 객체의 user_idx:", user.user_idx);
        
        if (serverUserIdx !== user.user_idx) {
          console.warn("⚠️ 사용자 ID 불일치 감지!");
          console.warn("로컬:", user.user_idx, "vs 서버:", serverUserIdx);
        }
      }
    } catch (err) {
      console.log("현재 사용자 정보 조회 실패 (일부 백엔드에서는 이 API가 없을 수 있음):", err.message);
    }
  };

  // 초기 채팅방 목록 로드
  useEffect(() => {
    console.log("=== 사용자 정보 확인 ===");
    console.log("전체 user 객체:", user);
    console.log("user.user_idx:", user.user_idx);
    console.log("user의 모든 키:", Object.keys(user));
    
    // localStorage에 저장된 사용자 정보도 확인
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log("localStorage의 user 정보:", parsedUser);
        console.log("localStorage의 user_idx:", parsedUser.user_idx);
        
        if (parsedUser.user_idx !== user.user_idx) {
          console.warn("⚠️ props user와 localStorage user 불일치!");
          console.warn("props:", user.user_idx, "vs localStorage:", parsedUser.user_idx);
        }
      } catch (err) {
        console.error("localStorage user 파싱 실패:", err);
      }
    }
    
    // 사용자 ID가 1로 고정되어 있다면 경고
    if (user.user_idx === 1) {
      console.warn("🚨 사용자 ID가 1로 설정되어 있습니다!");
      console.warn("이것이 의도된 것인지 확인하세요.");
      console.warn("다른 사용자로 로그인했다면 localStorage를 초기화해보세요:");
      console.warn("localStorage.removeItem('user'); 그 후 새로고침");
    }
    
    // 현재 사용자 정보 재확인 (선택사항)
    fetchCurrentUser();
    
    fetchChatRooms();
  }, []);

  // 초기 로드 및 1초마다 새로고침
  useEffect(() => {
    if (!chatRoomIdx) return; // 채팅방이 선택되지 않았으면 메시지 조회 안함
    
    const stored = localStorage.getItem(`messages_${chatRoomIdx}`);
    if (stored) {
      setMessages(JSON.parse(stored));
    } else {
      setMessages([]);
    }
    setLoading(true);
    
    // 초기 메시지 로드
    fetchMessages();
    
    // 1초마다 메시지 새로고침
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(fetchMessages, 1000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [chatRoomIdx]);

  // 메시지가 업데이트될 때마다 스크롤
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 컴포넌트 언마운트 시 interval 정리
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // idx가 큰 사람을 왼쪽(false), 작은 사람을 오른쪽(true)으로 배치
  const isRightSide = (message) => {
    // 모든 메시지의 senderUserIdx를 수집해서 최대값을 구함
    const allUserIdxs = messages.map((msg) => msg.senderUserIdx);
    const maxIdx = Math.max(...allUserIdxs);

    // 현재 메시지의 senderUserIdx가 최대값보다 작으면 오른쪽(true)
    return message.senderUserIdx < maxIdx;
  };

  // 내 메시지인지 판별 (기존 로직 유지 - 참고용)
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

  // 채팅방 목록이 로딩 중이면 로딩 표시
  if (loadingChatRooms) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">채팅방 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 채팅방이 없으면 안내 메시지 표시
  if (chatRooms.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-4xl mb-4">💬</div>
          <p className="text-gray-500 text-lg">참여중인 채팅방이 없습니다.</p>
          <p className="text-gray-400 text-sm mt-2">
            거래를 시작하면 채팅방이 생성됩니다.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">메시지를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 overflow-y-auto">
        <div className="mb-4 flex justify-between items-center">
          <div>
          <h2 className="text-xl font-semibold text-gray-900">채팅방</h2>
            {chatRoomIdx && chatRooms.length > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {(() => {
                  const currentRoom = chatRooms.find(room => room.chatRoomIdx === chatRoomIdx);
                  const roomIndex = chatRooms.findIndex(room => room.chatRoomIdx === chatRoomIdx);
                  if (currentRoom) {
                    // 내가 구매자인지 판매자인지 확인
                    const isBuyer = currentRoom.buyerUserIdx === user.user_idx;
                    const myRole = isBuyer ? "구매자" : "판매자";
                    const counterpartId = isBuyer ? currentRoom.sellerUserIdx : currentRoom.buyerUserIdx;
                    
                    const roomTitle = `상품 ${currentRoom.productIdx}번 거래`;
                    const roleInfo = `${myRole} (상대방: ${counterpartId}번)`;
                    
                    return `${roomIndex + 1}번방 - ${roomTitle} - ${roleInfo}`;
                  }
                  return "채팅방 정보 없음";
                })()}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchChatRooms}
              className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
              disabled={loadingChatRooms}
            >
              {loadingChatRooms ? "새로고침 중..." : "목록 새로고침"}
            </button>
          <select
                className="text-sm border-gray-300 rounded px-3 py-2 min-w-[200px]"
                value={chatRoomIdx || ""}
                onChange={(e) => handleChatRoomChange(e.target.value)}
              >
                <option value="">채팅방을 선택하세요</option>
                                {chatRooms.map((room, index) => {
                    // 채팅방 번호를 더 깔끔하게 표시
                    const displayRoomNumber = index + 1; // 1부터 시작하는 순서
                    
                    // 내가 구매자인지 판매자인지 확인
                    const isBuyer = room.buyerUserIdx === user.user_idx;
                    const myRole = isBuyer ? "구매자" : "판매자";
                    const counterpartId = isBuyer ? room.sellerUserIdx : room.buyerUserIdx;
                    
                    // 채팅방 제목 구성
                    const roomTitle = `상품 ${room.productIdx}번 거래`;
                    const roleInfo = `${myRole} (상대방: ${counterpartId}번)`;
                    
                    return (
                      <option key={room.chatRoomIdx} value={room.chatRoomIdx}>
                        {displayRoomNumber}번방 - {roomTitle} - {roleInfo}
              </option>
                    );
                  })}
          </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {!chatRoomIdx ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">💬</div>
            <p className="text-gray-500 text-lg">채팅방을 선택해주세요.</p>
            <p className="text-gray-400 text-sm mt-2">
              위에서 채팅방을 선택하면 메시지를 확인할 수 있습니다.
            </p>
          </div>
        ) : (
          <>
        <div className="space-y-4">
          {messages.map((message, index) => {
            const isRight = isRightSide(message);
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
                  className={`flex ${
                    isRight ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex flex-col max-w-xs lg:max-w-md ${
                      isRight ? "items-end" : "items-start"
                    }`}
                  >
                    {!isRight && (
                      <div className="text-xs text-gray-500 mb-1 px-2">
                        {senderName}
                      </div>
                    )}

                    <div
                      className={`px-4 py-3 rounded-2xl shadow-sm ${
                        isRight
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
                        isRight ? "text-right" : "text-left"
                      }`}
                    >
                      {formatTime(message.chatSendDate)}
                        </div>
                      </div>
                </div>
              </div>
            );
          })}
              <div ref={messagesEndRef} />
        </div>

        {messages.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">💬</div>
            <p className="text-gray-500 text-lg">아직 메시지가 없습니다.</p>
            <p className="text-gray-400 text-sm mt-2">
              채팅을 시작해보세요!
            </p>
          </div>
            )}
          </>
        )}
      </div>

      {/* 메시지 입력 영역 - 채팅방이 선택된 경우에만 표시 */}
      {chatRoomIdx && (
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
      )}

      {chatRoomIdx && (
        <div className="fixed bottom-20 right-4 flex flex-col space-y-2">
        <div className="bg-white rounded-full shadow-lg px-3 py-2 flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-600">1초마다 새로고침</span>
        </div>

        <div className="bg-white rounded-lg shadow-lg px-3 py-2 text-xs text-gray-500 text-center">
          마지막 업데이트: {lastUpdate.toLocaleTimeString("ko-KR")}
        </div>
      </div>
      )}
    </>
  );
};

export default ChatRoom; 