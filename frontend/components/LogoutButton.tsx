import { logoutAction } from "@/app/actions/logoutAction";

export default function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="block text-center m- p-4 rounded-xl text-white font-semibold shadow bg-linear-to-r from-purple-600 to-indigo-600 hover:opacity-90 transition"
      >
        ログアウト
      </button>
    </form>
  );
}