import type { FC, ReactNode } from "react";

const ChatUsersLayout: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div>
      ChatUsersLayout
      {children}
    </div>
  );
};

export default ChatUsersLayout;
