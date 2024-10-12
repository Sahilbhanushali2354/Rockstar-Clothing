import { GiHanger } from "react-icons/gi";

const Loader = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
      <div className="relative">
        <GiHanger color="red" className="h-16 w-16 rounded-full animate-spin" />
      </div>
    </div>
  );
};

export default Loader;
