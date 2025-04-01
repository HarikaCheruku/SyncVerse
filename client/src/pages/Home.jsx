import JoinRoomForm from "../components/forms/JoinRoomForm";

function Home() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row items-center justify-center bg-gray-900 text-white p-4">
      <div className="md:w-1/2 flex justify-center mb-8 md:mb-0">
        <img
          src="https://via.placeholder.com/400x300?text=Illustration"
          alt="Illustration"
          className="w-3/4 md:w-1/2"
        />
      </div>
      <div className="md:w-1/2 flex flex-col items-center">
        <div className="flex items-center mb-6">
          <img
            src="https://via.placeholder.com/40?text=Logo"
            alt="Logo"
            className="mr-2"
          />
          <div>
            <h1 className="text-3xl font-bold">Code Sync</h1>
            <p className="text-sm text-gray-400">
              Code, Chat, and Collaborate. It’s ALL in Sync.
            </p>
          </div>
        </div>
        <JoinRoomForm />
      </div>
    </div>
  );
}

export default Home;