import type { FC, ReactNode } from "react";

const ChatLayout: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div>
      ChatLayout
      {children}
    </div>
  );
};

export default ChatLayout;
