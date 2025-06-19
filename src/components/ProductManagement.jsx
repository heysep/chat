import React, { useState, useEffect } from "react";

const ProductManagement = ({ user, onLogout }) => {
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [prodLoading, setProdLoading] = useState(false);
  const [prodError, setProdError] = useState(null);

  const [users, setUsers] = useState([]);
  const [userError, setUserError] = useState(null);

  const [searchTitle, setSearchTitle] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // 상품 상세 모달 상태
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // 거래 요청 모달 상태
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    quantity: 1,
  });
  const [transactionLoading, setTransactionLoading] = useState(false);

  // 상품 등록 폼 상태
  const [productForm, setProductForm] = useState({
    productTitle: "",
    productDesc: "",
    productPrice: "",
    productImg: "default.jpg",
    productQuantity: 1,
    productStatus: "AVAILABLE",
    category: "",
    tags: [],
    isSellingAvailable: true,
    seller_user_idx: user?.user_idx || 1,
  });
  const [registering, setRegistering] = useState(false);

  const BASE_URL = "http://localhost:8080/api";

  // 판매자 정보 조회 함수
  const fetchSellerInfo = async (userIdx) => {
    try {
      const response = await fetch(`${BASE_URL}/users/find/${userIdx}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("판매자 정보 조회 결과:", result);
      
      if (result.success && result.data) {
        return {
          userName: result.data.userName || result.data.user_name,
          companyName: result.data.companyName || result.data.company_name,
          userId: result.data.userId || result.data.user_id,
        };
      }
      return null;
    } catch (err) {
      console.error("판매자 정보 조회 실패:", err);
      return null;
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${BASE_URL}/users/list`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
        ? data.data
        : [];

      setUsers(list);
      setUserError(null);
    } catch (err) {
      console.error("사용자 목록 조회 실패:", err);
      setUserError(err.message);
    }
  };

  const handleUnauthorized = () => {
    alert("세션이 만료되었습니다. 다시 로그인해주세요.");
    onLogout();
  };

  // 상품 게시글 조회
  const fetchProducts = async () => {
    setProdLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/products/list`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
        ? data.data
        : [];

      const normalizeProduct = async (p) => {
        console.log("🔍 백엔드에서 받은 원본 상품 데이터:", p);
        
        const idx = p.seller_user_idx ?? p.sellerUserIdx ?? p.userIdx;
        const sellerInfo = await fetchSellerInfo(idx);
        return {
          productIdx: p.id ?? p.productId ?? p.product_idx ?? p.productIdx,
          createdAt: p.created_at ?? p.createdAt,
          featured: p.featured,
          productAvailDate: p.product_avail_date ?? p.productAvailDate,
          category: p.product_category ?? p.category ?? p.productCategory,
          productDesc: p.product_desc ?? p.productDesc,
          productImg: p.product_image ?? p.productImg,
          price: p.product_price ?? p.productPrice ?? p.price,
          productQuantity: p.product_quantity ?? p.productQuantity,
          productStatus: p.product_status ?? p.productStatus,
          tags: p.product_tags ?? p.tags,
          productTitle: p.product_title ?? p.productTitle,
          viewCount: p.view_count ?? p.viewCount,
          sellerUserIdx: idx,
          isSellingAvailable: p.is_selling_available ?? p.isSellingAvailable,
          sellerUserName: sellerInfo?.userName || sellerInfo?.user_name || "",
          sellerCompanyName: sellerInfo?.companyName || sellerInfo?.company_name || "",
          sellerUserId: sellerInfo?.userId || sellerInfo?.user_id || "",
        };
      };

      const mapped = await Promise.all(list.map(normalizeProduct));

      setProducts(mapped);
      setProdError(null);
    } catch (err) {
      console.error("상품 목록 조회 실패:", err);
      setProdError(err.message);
    } finally {
      setProdLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchProducts();
  }, []);

  // 상품 등록 함수
  const handleProductRegister = async () => {
    console.log("=== 상품 등록 시작 ===");
    console.log("productForm 전체:", productForm);
    console.log("productQuantity 값 확인:", productForm.productQuantity);
    console.log("productQuantity 타입:", typeof productForm.productQuantity);
    console.log("user 객체:", user);
    
    // 사용자 정보 확인
    if (!user || !user.user_idx) {
      alert("사용자 정보가 없습니다. 다시 로그인해주세요.");
      return;
    }
    
    if (
      !productForm.productTitle.trim() ||
      !productForm.productDesc.trim() ||
      !productForm.category.trim()
    ) {
      alert("제목, 설명, 카테고리는 필수 입력 항목입니다.");
      return;
    }

    if (
      productForm.productPrice === "" ||
      isNaN(Number(productForm.productPrice))
    ) {
      alert("가격을 올바르게 입력하세요.");
      return;
    }

    // 수량 검증 개선
    const quantity = Number(productForm.productQuantity);
    console.log("변환된 quantity:", quantity);
    console.log("quantity 타입:", typeof quantity);
    
    if (
      productForm.productQuantity === "" ||
      productForm.productQuantity === null ||
      productForm.productQuantity === undefined ||
      isNaN(quantity) ||
      quantity < 1
    ) {
      alert("수량을 올바르게 입력하세요 (1개 이상).");
      return;
    }

    setRegistering(true);
    try {
      // 전송 데이터 준비 - 확실한 숫자 값 보장
      const requestData = {
        productTitle: productForm.productTitle,
        productDesc: productForm.productDesc,
        productImg: productForm.productImg,
        productPrice: Number(productForm.productPrice),
        productQuantity: Math.max(1, Math.floor(quantity)),
        productAvailDate: null,
        sellerUserIdx: user.user_idx,
        productStatus: productForm.productStatus,
        productCategory: productForm.category,
        productTags: Array.isArray(productForm.tags) ? productForm.tags.join(',') : '',
        featured: false,
      };

      console.log("전송할 데이터:", requestData);

      const response = await fetch(`${BASE_URL}/products/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestData),
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      alert("상품이 성공적으로 등록되었습니다!");
      setShowRegisterModal(false);

      // 폼 초기화
      setProductForm({
        productTitle: "",
        productDesc: "",
        productPrice: "",
        productImg: "default.jpg",
        productQuantity: 1,
        productStatus: "AVAILABLE",
        category: "",
        tags: [],
        isSellingAvailable: true,
        seller_user_idx: user.user_idx,
      });

      // 상품 목록 새로고침
      fetchProducts();
    } catch (err) {
      console.error("상품 등록 실패:", err);
      alert(`상품 등록에 실패했습니다: ${err.message}`);
    } finally {
      setRegistering(false);
    }
  };

  // 태그 입력 처리
  const handleTagInput = (e) => {
    if (e.key === "Enter" && e.target.value.trim()) {
      e.preventDefault();
      const newTag = e.target.value.trim();
      if (!productForm.tags.includes(newTag)) {
        setProductForm((prev) => ({
          ...prev,
          tags: [...prev.tags, newTag],
        }));
      }
      e.target.value = "";
    }
  };

  // 태그 제거
  const removeTag = (tagToRemove) => {
    setProductForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const getSellerName = (product) => {
    // 새로운 판매자 정보 필드 우선 사용
    if (product.sellerUserName) {
      return product.sellerUserName;
    }
    if (product.sellerCompanyName) {
      return product.sellerCompanyName;
    }
    if (product.sellerUserId) {
      return product.sellerUserId;
    }
    
    // 기존 방식 (fallback)
    const idx = product.sellerUserIdx || product.seller_user_idx || product.userIdx;
    const found = users.find((u) => u.user_idx === idx || u.userIdx === idx);
    return (
      found?.user_name ||
      found?.userName ||
      found?.company_name ||
      product.sellerName ||
      product.writerName ||
      product.userName ||
      `판매자 ID: ${idx}` ||
      "알 수 없음"
    );
  };

  // 가격 포맷팅
  const formatPrice = (price) =>
    typeof price === "number" ? `${price.toLocaleString()}원` : "";

  const statusMap = {
    AVAILABLE: { label: "판매중", className: "text-green-600" },
    SOLD_OUT: { label: "품절", className: "text-red-600" },
    DISCONTINUED: { label: "단종", className: "text-gray-500" },
  };

  const handleProductSearch = async () => {
    const query = searchTitle.trim();
    if (!query) {
      setSearchResult(null);
      setSearchError(null);
      return;
    }

    setSearchLoading(true);
    setSearchError(null);

    try {
      // 백엔드 API 호출 - productId로 검색
      const response = await fetch(`${BASE_URL}/products/list/${encodeURIComponent(query)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (response.status === 404) {
        setSearchResult(null);
        setSearchError("검색 결과가 없습니다.");
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("검색 결과:", data);

      // 단일 상품 결과인 경우와 배열인 경우 모두 처리
      if (data) {
        const product = Array.isArray(data) ? data[0] : data;
        
        // 판매자 정보 조회
        const sellerIdx = product.seller_user_idx ?? product.sellerUserIdx;
        const sellerInfo = sellerIdx ? await fetchSellerInfo(sellerIdx) : null;
        
        // 상품 데이터 정규화
        const normalizedProduct = {
          productIdx: product.product_idx ?? product.productIdx,
          createdAt: product.created_at ?? product.createdAt,
          featured: product.featured,
          productAvailDate: product.product_avail_date ?? product.productAvailDate,
          category: product.product_category ?? product.category ?? product.productCategory,
          productDesc: product.product_desc ?? product.productDesc,
          productImg: product.product_image ?? product.productImg,
          price: product.product_price ?? product.productPrice ?? product.price,
          productQuantity: product.product_quantity ?? product.productQuantity,
          productStatus: product.product_status ?? product.productStatus,
          tags: product.product_tags ?? product.tags,
          productTitle: product.product_title ?? product.productTitle,
          viewCount: product.view_count ?? product.viewCount,
          sellerUserIdx: sellerIdx,
          isSellingAvailable: product.is_selling_available ?? product.isSellingAvailable,
          sellerUserName: sellerInfo?.userName || sellerInfo?.user_name || "",
          sellerCompanyName: sellerInfo?.companyName || sellerInfo?.company_name || "",
          sellerUserId: sellerInfo?.userId || sellerInfo?.user_id || "",
        };

        setSearchResult(normalizedProduct);
      } else {
        setSearchResult(null);
        setSearchError("검색 결과가 없습니다.");
      }
    } catch (err) {
      console.error("상품 검색 실패:", err);
      setSearchError(`검색 중 오류가 발생했습니다: ${err.message}`);
      setSearchResult(null);
    } finally {
      setSearchLoading(false);
    }
  };

  // 검색 결과 초기화
  const clearSearch = () => {
    setSearchTitle("");
    setSearchResult(null);
    setSearchError(null);
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  // 거래 요청 모달 열기
  const handleTransactionRequest = (product) => {
    setSelectedProduct(product);
    setTransactionForm({ quantity: 1 });
    setShowTransactionModal(true);
  };

  // 거래 요청 전송
  const handleSubmitTransactionRequest = async () => {
    if (!selectedProduct || !user) {
      alert("상품 또는 사용자 정보가 없습니다.");
      return;
    }

    if (transactionForm.quantity < 1) {
      alert("수량은 1개 이상이어야 합니다.");
      return;
    }

    if (transactionForm.quantity > selectedProduct.productQuantity) {
      alert(`재고가 부족합니다. 최대 ${selectedProduct.productQuantity}개까지 구매 가능합니다.`);
      return;
    }

    // 자신의 상품에는 거래 요청할 수 없음
    const sellerIdx = selectedProduct.sellerUserIdx || selectedProduct.seller_user_idx;
    if (sellerIdx === user.user_idx) {
      alert("자신의 상품에는 거래 요청할 수 없습니다.");
      return;
    }

    setTransactionLoading(true);
    try {
      const requestData = {
        buyerId: user.user_idx,
        productId: selectedProduct.productIdx,
        quantity: transactionForm.quantity,
      };

      console.log("거래 요청 데이터:", requestData);

      const response = await fetch(`${BASE_URL}/transactions/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestData),
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`거래 요청 실패: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log("거래 요청 성공:", result);

      // 거래 요청 성공 후 채팅방 생성 시도
      if (result && result.transactionIdx) {
        await createChatRoom(result.transactionIdx, user.user_idx, sellerIdx, selectedProduct.productIdx);
      }

      alert("거래 요청이 성공적으로 전송되었습니다!");
      setShowTransactionModal(false);
      setTransactionForm({ quantity: 1 });
      
      // 상품 목록 새로고침 (재고 업데이트 반영)
      fetchProducts();
    } catch (err) {
      console.error("거래 요청 실패:", err);
      alert(`거래 요청 실패: ${err.message}`);
    } finally {
      setTransactionLoading(false);
    }
  };

  // 채팅방 생성 함수
  const createChatRoom = async (transactionIdx, buyerUserIdx, sellerUserIdx, productIdx) => {
    try {
      console.log("채팅방 생성 시도:", {
        transactionIdx,
        buyerUserIdx,
        sellerUserIdx,
        productIdx
      });

      const chatRoomData = {
        transactionIdx: transactionIdx,
        buyerUserIdx: buyerUserIdx,
        sellerUserIdx: sellerUserIdx,
        productIdx: productIdx
      };

      const response = await fetch(`${BASE_URL}/chatroom/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(chatRoomData),
      });

      if (response.status === 401) {
        console.log("채팅방 생성 시 인증 오류");
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`채팅방 생성 실패: ${response.status} - ${errorText}`);
        return;
      }

      const chatRoomResult = await response.json();
      console.log("채팅방 생성 성공:", chatRoomResult);
      
    } catch (err) {
      console.error("채팅방 생성 중 오류:", err);
    }
  };

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 overflow-y-auto">
      {prodError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{prodError}</p>
        </div>
      )}
      
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">상품 관리</h2>
        <button
          onClick={() => setShowRegisterModal(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          새 상품 등록
        </button>
      </div>

      {prodLoading ? (
        <div className="text-center py-12 text-gray-500">
          목록을 불러오는 중...
        </div>
      ) : (
        <>
          <div className="mb-4 flex space-x-2">
            <input
              type="text"
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleProductSearch();
                }
              }}
              className="flex-1 px-4 py-2 border rounded-md text-sm"
              placeholder="상품 ID로 검색 (예: 1, 2, 3...)"
              disabled={searchLoading}
            />
            <button
              onClick={handleProductSearch}
              disabled={searchLoading || !searchTitle.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              {searchLoading ? "검색중..." : "검색"}
            </button>
            {(searchResult || searchError) && (
              <button
                onClick={clearSearch}
                className="px-4 py-2 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600 transition-colors"
              >
                초기화
              </button>
            )}
          </div>

          {/* 검색 에러 표시 */}
          {searchError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{searchError}</p>
            </div>
          )}

          {/* 검색 결과 표시 */}
          {searchResult && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">
                  🔍 검색 결과
                </h3>
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  ID: {searchResult.productIdx}
                </span>
              </div>
              <h4 className="font-medium text-gray-800 mb-2">
                {searchResult.productTitle || searchResult.productDesc || "제목 없음"}
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                <div>가격: {formatPrice(searchResult.price)}</div>
                <div>수량: {searchResult.productQuantity}</div>
                <div>카테고리: {searchResult.category || "미분류"}</div>
                <div>
                  상태: {statusMap[searchResult.productStatus]?.label || searchResult.productStatus}
                </div>
              </div>
              <div className="text-sm text-gray-600 mb-2">
                <span className="font-medium">판매자:</span> {getSellerName(searchResult)}
                {searchResult.sellerCompanyName && searchResult.sellerUserName && (
                  <span className="text-xs text-gray-500 ml-1">
                    ({searchResult.sellerCompanyName})
                  </span>
                )}
              </div>
              {searchResult.productDesc && (
                <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                  {searchResult.productDesc}
                </p>
              )}
              <button
                onClick={() => handleProductClick(searchResult)}
                className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                자세히 보기 →
              </button>
            </div>
          )}
          
          <div className="space-y-4">
            {products.map((product) => (
              <div
                key={product.productIdx || product.id}
                className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleProductClick(product)}
              >
                <div className="flex items-center mb-2">
                  <h3 className="font-semibold text-gray-900 flex-1">
                    {product.productDesc || "제목 없음"}
                  </h3>
                  {product.productStatus && (
                    <span
                      className={`text-xs font-medium ${
                        statusMap[product.productStatus]?.className || ""
                      }`}
                    >
                      {statusMap[product.productStatus]?.label ||
                        product.productStatus}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm text-gray-600">
                  <div>가격: {formatPrice(product.price)}</div>
                  <div>수량: {product.productQuantity}</div>
                  <div>카테고리: {product.category || "미분류"}</div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  판매자: {getSellerName(product)}
                </div>
                {product.tags && product.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {product.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                {product.content && (
                  <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                    {product.content}
                  </p>
                )}
                <div className="flex justify-between items-center mt-3">
                  <p className="text-sm text-blue-600 cursor-pointer hover:text-blue-800">자세히 보기 →</p>
                  {/* 거래 요청 버튼 - 판매중이고 다른 사람의 상품일 때만 표시 */}
                  {(() => {
                    const isAvailable = product.productStatus === "AVAILABLE";
                    const isSellingAvailable = product.isSellingAvailable !== false; // undefined나 null이면 true로 처리
                    const sellerIdx = product.sellerUserIdx || product.seller_user_idx;
                    const isNotMyProduct = sellerIdx !== user.user_idx;
                    
                    console.log('상품 ID:', product.productIdx, {
                      productStatus: product.productStatus,
                      isSellingAvailable: product.isSellingAvailable,
                      sellerIdx: sellerIdx,
                      userIdx: user.user_idx,
                      isAvailable,
                      isNotMyProduct,
                      shouldShowButton: isAvailable && isSellingAvailable && isNotMyProduct
                    });
                    
                    return isAvailable && isSellingAvailable && isNotMyProduct && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTransactionRequest(product);
                        }}
                        className="text-xs bg-green-500 text-white px-3 py-1 rounded-full hover:bg-green-600 transition-colors"
                      >
                        거래 요청
                      </button>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      
      {products.length === 0 && !prodLoading && !prodError && (
        <div className="text-center py-12 text-gray-500">
          게시글이 없습니다.
        </div>
      )}

      {/* 상품 등록 모달 */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  새 상품 등록
                </h2>
                <button
                  onClick={() => setShowRegisterModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={registering}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    상품명 *
                  </label>
                  <input
                    type="text"
                    value={productForm.productTitle}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        productTitle: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                    placeholder="상품명을 입력하세요"
                    disabled={registering}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    상품 설명 *
                  </label>
                  <textarea
                    value={productForm.productDesc}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        productDesc: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                    placeholder="상품 설명을 입력하세요"
                    rows={3}
                    disabled={registering}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    상품 이미지
                  </label>
                  <input
                    type="text"
                    value={productForm.productImg}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        productImg: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                    placeholder="이미지 파일명을 입력하세요"
                    disabled={registering}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    가격
                  </label>
                  <input
                    type="number"
                    value={productForm.productPrice}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        productPrice: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                    placeholder="가격을 입력하세요"
                    disabled={registering}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    카테고리 *
                  </label>
                  <select
                    value={productForm.category}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                    disabled={registering}
                  >
                    <option value="">카테고리를 선택하세요</option>
                    <option value="전자제품">전자제품</option>
                    <option value="의류">의류</option>
                    <option value="가구">가구</option>
                    <option value="도서">도서</option>
                    <option value="기타">기타</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    수량
                  </label>
                  <input
                    type="number"
                    value={productForm.productQuantity}
                    onChange={(e) => {
                      const value = e.target.value;
                      // 빈 문자열이면 1로 설정, 그렇지 않으면 숫자로 변환
                      const numValue = value === "" ? 1 : Number(value);
                      setProductForm((prev) => ({
                        ...prev,
                        productQuantity: isNaN(numValue) ? 1 : Math.max(1, numValue),
                      }));
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                    min="1"
                    step="1"
                    disabled={registering}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    태그
                  </label>
                  <input
                    type="text"
                    onKeyDown={handleTagInput}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                    placeholder="태그를 입력하고 Enter를 누르세요"
                    disabled={registering}
                  />
                  {productForm.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {productForm.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm flex items-center"
                        >
                          {tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                            type="button"
                            disabled={registering}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    상품 상태
                  </label>
                  <select
                    value={productForm.productStatus}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        productStatus: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                    disabled={registering}
                  >
                    <option value="AVAILABLE">판매중</option>
                    <option value="SOLD_OUT">품절</option>
                    <option value="DISCONTINUED">단종</option>
                  </select>
                </div>
                
                <div className="flex items-center mt-2">
                  <input
                    id="sellingAvailable"
                    type="checkbox"
                    checked={productForm.isSellingAvailable}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        isSellingAvailable: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    disabled={registering}
                  />
                  <label
                    htmlFor="sellingAvailable"
                    className="ml-2 text-sm font-medium text-gray-700"
                  >
                    판매 가능 여부
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowRegisterModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  disabled={registering}
                >
                  취소
                </button>
                <button
                  onClick={handleProductRegister}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:bg-blue-300"
                  disabled={registering}
                >
                  {registering ? "등록 중..." : "등록"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 상품 상세 모달 */}
      {showProductModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedProduct.productDesc || "상세 정보"}
                </h2>
                <button
                  onClick={() => setShowProductModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div className="w-full h-40 bg-gray-100 flex items-center justify-center rounded-md">
                  {selectedProduct.productImg ? (
                    <img
                      src={selectedProduct.productImg}
                      alt=""
                      className="max-h-full"
                    />
                  ) : (
                    <div className="text-4xl">📦</div>
                  )}
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {formatPrice(selectedProduct.price)}
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                  <div>카테고리: {selectedProduct.category || "미분류"}</div>
                  <div>수량: {selectedProduct.productQuantity}</div>
                  <div>
                    상태: {statusMap[selectedProduct.productStatus]?.label || selectedProduct.productStatus}
                  </div>
                </div>
                {selectedProduct.productDesc && (
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {selectedProduct.productDesc}
                  </p>
                )}
                {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">태그:</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="text-sm text-gray-700 border-t pt-3 mt-3">
                  <div className="font-medium mb-2">판매자 정보</div>
                  <div>이름: {getSellerName(selectedProduct)}</div>
                  {selectedProduct.sellerCompanyName && (
                    <div>회사: {selectedProduct.sellerCompanyName}</div>
                  )}
                </div>
                <div className="text-xs text-gray-500 space-y-1 border-t pt-2 mt-2">
                  <div>
                    상품 ID: {selectedProduct.productIdx || selectedProduct.id}
                  </div>
                  <div>
                    판매자 ID:{" "}
                    {selectedProduct.seller_user_idx ||
                      selectedProduct.sellerUserIdx}
                  </div>
                </div>

                {/* 거래 요청 버튼 - 판매중이고 다른 사람의 상품일 때만 표시 */}
                {selectedProduct.productStatus === "AVAILABLE" && 
                 selectedProduct.isSellingAvailable && 
                 (selectedProduct.sellerUserIdx || selectedProduct.seller_user_idx) !== user.user_idx && (
                  <div className="mt-4 pt-4 border-t">
                    <button
                      onClick={() => {
                        setShowProductModal(false);
                        handleTransactionRequest(selectedProduct);
                      }}
                      className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors font-medium"
                    >
                      거래 요청하기
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 거래 요청 모달 */}
      {showTransactionModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  거래 요청
                </h2>
                <button
                  onClick={() => setShowTransactionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={transactionLoading}
                >
                  ✕
                </button>
              </div>

              {/* 상품 정보 */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {selectedProduct.productDesc || "상품 정보"}
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>단가: {formatPrice(selectedProduct.price)}</div>
                  <div>재고: {selectedProduct.productQuantity}개</div>
                  <div>판매자: {getSellerName(selectedProduct)}</div>
                </div>
              </div>

              {/* 거래 요청 폼 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    구매 수량 *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedProduct.productQuantity}
                    value={transactionForm.quantity}
                    onChange={(e) => {
                      const value = Math.max(1, Math.min(selectedProduct.productQuantity, parseInt(e.target.value) || 1));
                      setTransactionForm(prev => ({ ...prev, quantity: value }));
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                    placeholder="구매할 수량을 입력하세요"
                    disabled={transactionLoading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    최대 {selectedProduct.productQuantity}개까지 구매 가능
                  </p>
                </div>

                {/* 총 금액 계산 */}
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-1">총 구매 금액</div>
                  <div className="text-lg font-bold text-blue-600">
                    {formatPrice((selectedProduct.price || 0) * transactionForm.quantity)}
                  </div>
                </div>

                {/* 주의사항 */}
                <div className="text-xs text-gray-500 bg-yellow-50 p-3 rounded-lg">
                  <div className="font-medium text-yellow-800 mb-1">📝 참고사항</div>
                  <ul className="space-y-1 text-yellow-700">
                    <li>• 거래 요청 후 판매자의 승인을 기다려주세요</li>
                    <li>• 거래 진행 상황은 거래 관리 탭에서 확인할 수 있습니다</li>
                    <li>• 취소나 변경이 필요한 경우 판매자에게 문의하세요</li>
                  </ul>
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowTransactionModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  disabled={transactionLoading}
                >
                  취소
                </button>
                <button
                  onClick={handleSubmitTransactionRequest}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-green-300"
                  disabled={transactionLoading}
                >
                  {transactionLoading ? "요청 중..." : "거래 요청"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement; 