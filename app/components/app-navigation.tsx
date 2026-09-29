import type { AppUser, View } from "../../lib/types";
import { BrandLogo, NavButton } from "./common";

type NavigationProps = {
  view: View;
  user: AppUser;
  onView: (view: View) => void;
  onToday: () => void;
};

export function DesktopNavigation({
  view,
  user,
  collapsed,
  onToggle,
  onView,
  onToday,
}: NavigationProps & { collapsed: boolean; onToggle: () => void }) {
  return (
    <aside className="sidebar">
      <button
        type="button"
        className="sidebar-toggle"
        aria-label={collapsed ? "메뉴 펼치기" : "메뉴 접기"}
        title={collapsed ? "메뉴 펼치기" : "메뉴 접기"}
        onClick={onToggle}
      >
        {collapsed ? "›" : "‹"}
      </button>
      <button
        type="button"
        className="brand"
        onClick={onToday}
        aria-label="작은다음 오늘 화면으로 이동"
      >
        <BrandLogo inverse />
      </button>
      <nav>
        <NavButton
          icon="⌂"
          label="오늘"
          active={view === "today"}
          onClick={onToday}
        />
        <NavButton
          icon="✓"
          label="할 일"
          active={view === "todo"}
          onClick={() => onView("todo")}
        />
        <NavButton
          icon="□"
          label="캘린더"
          active={view === "calendar"}
          onClick={() => onView("calendar")}
        />
        <NavButton
          icon="₩"
          label="가계부"
          active={view === "ledger"}
          onClick={() => onView("ledger")}
        />
        <NavButton
          icon="✎"
          label="하루 기록"
          active={view === "records"}
          onClick={() => onView("records")}
        />
        <NavButton
          icon="♡"
          label="감정 일기"
          active={view === "diary"}
          onClick={() => onView("diary")}
        />
        <NavButton
          icon="▥"
          label="통계"
          active={view === "stats"}
          onClick={() => onView("stats")}
        />
      </nav>
      <div className="sidebar-bottom">
        <NavButton
          icon="⚙"
          label="설정"
          active={view === "settings"}
          onClick={() => onView("settings")}
        />
        <button
          type="button"
          className={`profile profile-button ${view === "profile" ? "active" : ""}`}
          onClick={() => onView("profile")}
        >
          <span>{user.name.slice(0, 1).toUpperCase()}</span>
          <div>
            <b>{user.name}</b>
            <small>{user.email}</small>
          </div>
        </button>
      </div>
    </aside>
  );
}

export function MobileNavigation({
  view,
  user,
  moreOpen,
  onView,
  onToday,
  onAdd,
  onToggleMore,
}: NavigationProps & {
  moreOpen: boolean;
  onAdd: () => void;
  onToggleMore: () => void;
}) {
  const addLabel =
    view === "ledger"
      ? "거래 추가"
      : view === "records"
        ? "하루 기록 추가"
        : view === "todo"
          ? "할 일 추가"
          : "선택한 날짜에 일정 추가";

  return (
    <>
      <header className="mobile-topbar">
        <button
          type="button"
          className="mobile-brand"
          onClick={onToday}
          aria-label="작은다음 오늘 화면으로 이동"
        >
          <BrandLogo />
        </button>
        <button
          type="button"
          className={`mobile-profile ${view === "profile" ? "active" : ""}`}
          aria-label="프로필 열기"
          onClick={() => onView("profile")}
        >
          <span>{user.name.slice(0, 1).toUpperCase()}</span>
        </button>
      </header>
      <div className="mobile-nav">
        <NavButton
          icon="⌂"
          label="오늘"
          active={view === "today"}
          onClick={onToday}
        />
        <NavButton
          icon="□"
          label="캘린더"
          active={view === "calendar"}
          onClick={() => onView("calendar")}
        />
        <button
          type="button"
          className="mobile-add"
          aria-label={addLabel}
          onClick={onAdd}
        >
          ＋
        </button>
        <NavButton
          icon="₩"
          label="가계부"
          active={view === "ledger"}
          onClick={() => onView("ledger")}
        />
        <NavButton
          icon="•••"
          label="더보기"
          active={
            moreOpen ||
            ["todo", "stats", "records", "diary", "settings"].includes(view)
          }
          onClick={onToggleMore}
        />
      </div>
      {moreOpen ? (
        <dialog open className="mobile-more-backdrop" aria-label="더보기 메뉴">
          <section className="mobile-more-sheet">
            <div>
              <b>더보기</b>
              <button
                type="button"
                aria-label="더보기 메뉴 닫기"
                onClick={onToggleMore}
              >
                ×
              </button>
            </div>
            <button type="button" onClick={() => onView("records")}>
              <span>✎</span>
              <b>하루 기록</b>
              <small>작은 순간을 자유롭게 기록</small>
            </button>
            <button type="button" onClick={() => onView("todo")}>
              <span>✓</span>
              <b>할 일</b>
              <small>날짜 없는 일을 모아 일정으로 옮기기</small>
            </button>
            <button type="button" onClick={() => onView("diary")}>
              <span>♡</span>
              <b>감정 일기</b>
              <small>하루의 감정과 강도 돌아보기</small>
            </button>
            <button type="button" onClick={() => onView("stats")}>
              <span>▥</span>
              <b>통계</b>
              <small>일정, 지출, 감정 흐름 확인</small>
            </button>
            <button type="button" onClick={() => onView("settings")}>
              <span>⚙</span>
              <b>설정</b>
              <small>계정과 데이터 관리</small>
            </button>
          </section>
        </dialog>
      ) : null}
    </>
  );
}
