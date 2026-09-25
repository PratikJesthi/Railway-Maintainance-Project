export default function Card({ className = '', children }) {
  return (
    <div className={'bg-[#101B2D] border border-[#26364D] rounded-md shadow-[0_2px_8px_rgba(0,0,0,0.4)] ' + className}>
      {children}
    </div>
  );
}

