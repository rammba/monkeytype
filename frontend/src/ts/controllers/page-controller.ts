import * as Misc from "../utils/misc";
import * as Strings from "../utils/strings";
import * as ActivePage from "../states/active-page";
import * as Settings from "../pages/settings";
import * as Account from "../pages/account";
import * as PageTest from "../pages/test";
import * as PageAbout from "../pages/about";
import * as PageLogin from "../pages/login";
import * as PageLoading from "../pages/loading";
import * as PageTribe from "../pages/tribe";
import * as PageProfile from "../pages/profile";
import * as PageProfileSearch from "../pages/profile-search";
import * as Page404 from "../pages/404";
import * as PageAccountSettings from "../pages/account-settings";
import * as PageTransition from "../states/page-transition";
import * as AdController from "../controllers/ad-controller";
import * as Focus from "../test/focus";

type ChangeOptions = {
  force?: boolean;
  params?: Record<string, string>;
  data?: unknown;
  tribeOverride?: boolean;
};

export async function change(
  pageName: MonkeyTypes.PageName,
  options = {} as ChangeOptions
): Promise<boolean> {
  const defaultOptions = {
    force: false,
    tribeOverride: false,
  };

  options = { ...defaultOptions, ...options };

  return new Promise((resolve) => {
    if (PageTransition.get()) {
      console.debug(
        `change page to ${pageName} stopped, page transition is true`
      );
      resolve(false);
      return;
    }

    if (!options.force && ActivePage.get() === pageName) {
      console.debug(`change page ${pageName} stoped, page already active`);
      resolve(false);
      return;
    } else {
      console.log(`changing page ${pageName}`);
    }

    const pages = {
      loading: PageLoading.page,
      test: PageTest.page,
      settings: Settings.page,
      about: PageAbout.page,
      account: Account.page,
      login: PageLogin.page,
      tribe: PageTribe.page,
      profile: PageProfile.page,
      profileSearch: PageProfileSearch.page,
      404: Page404.page,
      accountSettings: PageAccountSettings.page,
    };

    const previousPage = pages[ActivePage.get()];
    const nextPage = pages[pageName];

    void previousPage
      ?.beforeHide({
        tribeOverride: options.tribeOverride ?? false,
      })
      .then(() => {
        PageTransition.set(true);
        $(".page").removeClass("active");
        void Misc.swapElements(
          previousPage.element,
          nextPage.element,
          250,
          async () => {
            PageTransition.set(false);
            nextPage.element.addClass("active");
            resolve(true);
            await nextPage?.afterShow();
            void AdController.reinstate();
          },
          async () => {
            if (nextPage.name === "test") {
              Misc.updateTitle();
            } else {
              Misc.updateTitle(
                Strings.capitalizeFirstLetterOfEachWord(nextPage.name) +
                  " | Monkeytype"
              );
            }
            Focus.set(false);
            ActivePage.set(nextPage.name);
            await previousPage?.afterHide();
            await nextPage?.beforeShow({
              params: options.params,
              //@ts-expect-error
              data: options.data,
              tribeOverride: options.tribeOverride ?? false,
            });
          }
        );
      });
  });
}
