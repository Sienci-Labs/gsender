# React Router V7 declarative mode - Docs

This guide walks you through setting up PostHog for React Router V7 in declarative mode. If you're using React Router in another mode, find the guide for that mode in the [React Router page](/docs/libraries/react-router.md). If you're using React with another framework, go to the [React integration guide](/docs/libraries/react.md).

1.  1

    ## Install client-side SDKs

    Required

    First, you'll need to install [`posthog-js`](https://github.com/posthog/posthog-js) and `@posthog/react` using your package manager. These packages allow you to capture **client-side** events.

    PostHog AI

    ### npm

    ```bash
    npm install --save posthog-js @posthog/react
    ```

    ### Yarn

    ```bash
    yarn add posthog-js @posthog/react
    ```

    ### pnpm

    ```bash
    pnpm add posthog-js @posthog/react
    ```

    ### Bun

    ```bash
    bun add posthog-js @posthog/react
    ```

2.  2

    ## Add your environment variables

    Required

    Add your environment variables to your `.env.local` file and to your hosting provider (e.g. Vercel, Netlify, AWS). You can find your project token and host in [your project settings](https://us.posthog.com/settings/project). If you're using Vite, including `VITE_PUBLIC_` in their names ensures they are accessible in the frontend.

    .env.local

    PostHog AI

    ```shell
    VITE_PUBLIC_POSTHOG_TOKEN=<ph_project_token>
    VITE_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
    ```

3.  3

    ## Add the PostHogProvider to your app

    Required

    In declarative mode, you'll need to wrap your `BrowserRouter` with the `PostHogProvider` context. This passes an initialized PostHog client to your app.

    src/main.tsx

    PostHog AI

    ```jsx
    import { StrictMode } from "react";
    import ReactDOM from "react-dom/client";
    import { BrowserRouter, Routes, Route } from "react-router";
    import posthog from 'posthog-js';
    import { PostHogErrorBoundary, PostHogProvider } from '@posthog/react'
    // Initialize PostHog
    posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_TOKEN, {
      api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
      defaults: '2026-01-30',
    });
    const root = document.getElementById("root");
    ReactDOM.createRoot(root).render(
      <StrictMode>
        {/* Pass PostHog client through PostHogProvider */}
        <PostHogProvider client={posthog}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Root />}>
            {/* ... Your routes ... */}
            </Route>
          </Routes>
        </BrowserRouter>
        </PostHogProvider>
      </StrictMode>,
    );
    ```

    This initializes PostHog and passes it to your app through the `PostHogProvider` context.

    TypeError: Cannot read properties of undefined

    If you see the error `TypeError: Cannot read properties of undefined (reading '...')` this is likely because you tried to call a posthog function when posthog was not initialized (such as during the initial render). On purpose, we still render the children even if PostHog is not initialized so that your app still loads even if PostHog can't load.

    To fix this error, add a check that posthog has been initialized such as:

    React

    PostHog AI

    ```jsx
    useEffect(() => {
      posthog?.capture('test') // using optional chaining (recommended)
      if (posthog) {
        posthog.capture('test') // using an if statement
      }
    }, [posthog])
    ```

    Typescript helps protect against these errors.

4.  ## Verify client-side events are captured

    Checkpoint

    *Confirm that you can capture client-side events and see them in your PostHog project*

    At this point, you should be able to capture client-side events and see them in your PostHog project. This includes basic events like page views and button clicks that are [autocaptured](/docs/product-analytics/autocapture.md).

    You can also try to capture a custom event to verify it's working. You can access PostHog in any component using the `usePostHog` hook.

    TSX

    PostHog AI

    ```jsx
    import { usePostHog } from '@posthog/react'
    function App() {
      const posthog = usePostHog()
      return <button onClick={() => posthog?.capture('button_clicked')}>Click me</button>
    }
    ```

    You should see these events in a minute or two in the [activity tab](https://app.posthog.com/activity/explore).

5.  4

    ## Access PostHog methods

    Required

    On the client-side, you can access the PostHog client using the `usePostHog` hook. This hook returns the initialized PostHog client, which you can use to call PostHog methods. For example:

    TSX

    PostHog AI

    ```jsx
    import { usePostHog } from '@posthog/react'
    function App() {
      const posthog = usePostHog()
      return <button onClick={() => posthog?.capture('button_clicked')}>Click me</button>
    }
    ```

    For a complete list of available methods, see the [posthog-js documentation](/docs/libraries/js.md).

6.  5

    ## Identify your user

    Recommended

    Now that you can capture basic client-side events, you'll want to identify your user so you can associate users with captured events.

    Generally, you identify users when they log in or when they input some identifiable information (e.g. email, name, etc.). You can identify users by calling the `identify` method on the PostHog client:

    TSX

    PostHog AI

    ```jsx
    export default function Login() {
      const { user, login } = useAuth();
      const posthog = usePostHog();
      const handleLogin = async (e: React.FormEvent) => {
        // existing code to handle login...
        const user = await login({ email, password });
        posthog?.identify(user.email,
          {
            email: user.email,
            name: user.name,
          }
        );
        posthog?.capture('user_logged_in');
      };
      return (
        <div>
          {/* ... existing code ... */}
          <button onClick={handleLogin}>Login</button>
        </div>
      );
    }
    ```

    PostHog automatically generates anonymous IDs for users before they're identified. When you call identify, a new identified person is created. All previous events tracked with the anonymous ID link to the new identified distinct ID, and all future captures on the same browser associate with the identified person.

7.  6

    ## Create an error boundary

    Recommended

    PostHog can capture exceptions thrown in your app through an error boundary. PostHog provides a `PostHogErrorBoundary` component that you can use to capture exceptions. You can wrap your app with this component to capture exceptions.

    TSX

    PostHog AI

    ```jsx
    ReactDOM.createRoot(root).render(
      <StrictMode>
        <PostHogProvider client={posthog}>
        <PostHogErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Root />}>
              {/* ... Your routes ... */}
            </Route>
          </Routes>
        </BrowserRouter>
        </PostHogErrorBoundary>
        </PostHogProvider>
      </StrictMode>,
    );
    ```

    This automatically captures exceptions thrown in your React Router app using the `posthog.captureException()` method.

8.  7

    ## Tracking element visibility

    Recommended

    The `PostHogCaptureOnViewed` component enables you to automatically capture events when elements scroll into view in the browser. This is useful for tracking impressions of important content, monitoring user engagement with specific sections, or understanding which parts of your page users are actually seeing.

    The component wraps your content and sends a `$element_viewed` event to PostHog when the wrapped element becomes visible in the viewport. It only fires once per component instance.

    **Basic usage:**

    React

    PostHog AI

    ```jsx
    import { PostHogCaptureOnViewed } from '@posthog/react'
    function App() {
        return (
            <PostHogCaptureOnViewed name="hero-banner">
                <div>Your important content here</div>
            </PostHogCaptureOnViewed>
        )
    }
    ```

    **With custom properties:**

    You can include additional properties with the event to provide more context:

    React

    PostHog AI

    ```jsx
    <PostHogCaptureOnViewed
        name="product-card"
        properties={{
            product_id: '123',
            category: 'electronics',
            price: 299.99
        }}
    >
        <ProductCard />
    </PostHogCaptureOnViewed>
    ```

    **Tracking multiple children:**

    Use `trackAllChildren` to track each child element separately. This is useful for galleries or lists where you want to know which specific items were viewed:

    React

    PostHog AI

    ```jsx
    <PostHogCaptureOnViewed
        name="product-gallery"
        properties={{ gallery_type: 'featured' }}
        trackAllChildren
    >
        <ProductCard id="1" />
        <ProductCard id="2" />
        <ProductCard id="3" />
    </PostHogCaptureOnViewed>
    ```

    When `trackAllChildren` is enabled, each child element sends its own event with a `child_index` property indicating its position.

    **Custom intersection observer options:**

    You can customize when elements are considered "viewed" by passing options to the `IntersectionObserver`:

    React

    PostHog AI

    ```jsx
    <PostHogCaptureOnViewed
        name="footer"
        observerOptions={{
            threshold: 0.5,  // Element is 50% visible
            rootMargin: '0px'
        }}
    >
        <Footer />
    </PostHogCaptureOnViewed>
    ```

    The component passes all other props to the wrapper `div`, so you can add styling, classes, or other HTML attributes as needed.

9.  8

    ## Set up server-side analytics

    Recommended

    Now that you've set up PostHog for React Router V7 in declarative mode, you can continue to set up server-side analytics. You can find our other SDKs in the [SDKs page](/docs/libraries.md).

    To help PostHog track your user sessions across the client and server, you'll need to add the `__add_tracing_headers: ['your-backend-domain1.com', 'your-backend-domain2.com', ...]` option to your PostHog initialization:

    TSX

    PostHog AI

    ```jsx
    posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_TOKEN, {
      api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
      defaults: '2026-01-30',
      __add_tracing_headers: [ window.location.host, 'localhost' ],
    });
    ```

    This adds the `X-POSTHOG-DISTINCT-ID` and `X-POSTHOG-SESSION-ID` headers to your requests, which you can later use on the server-side.

10.  9

     ## Next steps

     Recommended

     Now that you've set up PostHog for React Router, you can start capturing events and exceptions in your app.

     To get the most out of PostHog, you should familiarize yourself with the following:

     -   [PostHog Web SDK docs](/docs/libraries/js.md): Learn more about the PostHog Web SDK and how to use it on the client-side.
     -   [PostHog Node SDK docs](/docs/libraries/node.md): Learn more about the PostHog Node SDK and how to use it on the server-side.
     -   [Identify users](/docs/product-analytics/identify.md): Learn more about how to identify users in your app.
     -   [Group analytics](/docs/product-analytics/group-analytics.md): Learn more about how to use group analytics in your app.
     -   [PostHog AI](/docs/posthog-ai.md): After capturing events, use PostHog AI to help you understand your data and build insights.
     -   [Feature flags and experiments](/docs/libraries/react.md#feature-flags): Feature flag and experiment setup is the same as React. You can find more details in the React integration guide.

### Community questions

Ask a question

### Was this page useful?

HelpfulCould be better