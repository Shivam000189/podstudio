import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useMutation } from "@tanstack/react-query";

type CreateRequest = {
  createId: string;
};

type ResponseData = {
  GenerateID: string;
};

const fetchRoomId = async (data: CreateRequest): Promise<ResponseData> => {
  const response = await API.post(`/rooms/create`, data);
  return response.data;
};

export function Home() {
  const navigate = useNavigate(); // ✅ use 'navigate', not 'navigation'

  const createMutation = useMutation({
    mutationFn: fetchRoomId,
    onSuccess: (data) => {
      navigate(`/rooms/${data.GenerateID}`); // ✅ extract the actual ID string
    },
    onError: (error) => {
      console.log("Room creation failed:", error); // ✅ fixed syntax
    },
  });

  const handleClick = () => {
    // ✅ pass the correct field name, and define the value
    const createId = crypto.randomUUID(); // or however you get/generate it
    createMutation.mutate({ createId });
  };

  return (
    <div className="flex bg-amber-100">
      <div className="h-screen min-w-1/2 flex justify-center items-center ">
        Images
      </div>

      <div className="justify-center items-center grid grid-rows-2 h-screen  ">
        <div className="">
          <p className="p-10">
            Lorem ipsum, dolor sit amet consectetur adipisicing elit. Hic illum
            numquam dolorem modi corporis molestiae magni in cupiditate vel
            culpa, consectetur expedita. Magni maxime nostrum cumque porro animi
            assumenda adipisci.
          </p>
          <div className="flex justify-center">
            <button
              className="border-2 bg-gray-400"
              onClick={handleClick}
              disabled={createMutation.isPending} // ✅ good UX: disable while loading
            >
              {createMutation.isPending ? "Creating..." : "Create room"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
