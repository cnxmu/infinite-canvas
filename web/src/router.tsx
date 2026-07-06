import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Outlet } from "react-router-dom";

import UserLayout from "@/layouts/user-layout";

const AssetsPage = lazy(() => import("@/pages/assets"));
const CanvasPage = lazy(() => import("@/pages/canvas"));
const CanvasProjectPage = lazy(() => import("@/pages/canvas/project"));
const HomePage = lazy(() => import("@/pages/home"));
const ImagePage = lazy(() => import("@/pages/image"));
const NotFound = lazy(() => import("@/pages/not-found"));
const PromptsPage = lazy(() => import("@/pages/prompts"));
const VideoPage = lazy(() => import("@/pages/video"));

function routeElement(children: ReactNode) {
    return <Suspense fallback={<RouteLoading />}>{children}</Suspense>;
}

function RouteLoading() {
    return <main className="flex h-full items-center justify-center bg-background text-sm text-stone-500 dark:text-stone-400">正在加载...</main>;
}

export const router = createBrowserRouter([
    {
        element: (
            <UserLayout>
                <Outlet />
            </UserLayout>
        ),
        children: [
            { path: "/", element: routeElement(<HomePage />) },
            { path: "/image", element: routeElement(<ImagePage />) },
            { path: "/video", element: routeElement(<VideoPage />) },
            { path: "/assets", element: routeElement(<AssetsPage />) },
            { path: "/prompts", element: routeElement(<PromptsPage />) },
            { path: "/canvas", element: routeElement(<CanvasPage />) },
            { path: "/canvas/:id", element: routeElement(<CanvasProjectPage />) },
        ],
    },
    { path: "*", element: routeElement(<NotFound />) },
]);
