import { useEffect, useState } from 'react';
import { clientInitData } from '@/web/common/system/staticData';
import { useRouter } from 'next/router';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import type { FastGPTFeConfigsType } from '@fastgpt/global/common/system/types/index.d';
import { useMemoizedFn, useMount } from 'ahooks';
import { TrackEventName } from '../common/system/constants';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { useUserStore } from '../support/user/useUserStore';

export const useInitApp = () => {
  const router = useRouter();
  const { hiId, bd_vid, k, sourceDomain } = router.query as {
    hiId?: string;
    bd_vid?: string;
    k?: string;
    sourceDomain?: string;
  };
  const { loadGitStar, setInitd, feConfigs } = useSystemStore();
  const { userInfo } = useUserStore();
  const [scripts, setScripts] = useState<FastGPTFeConfigsType['scripts']>([]);
  const [title, setTitle] = useState(process.env.SYSTEM_NAME || 'AI');

  const initFetch = useMemoizedFn(async () => {
    const {
      feConfigs: { scripts, isPlus, systemTitle }
    } = await clientInitData();

    setTitle(systemTitle || 'SusuGPT');

    // log fastgpt
    if (!isPlus) {
      console.log(
        '%cWelcome to 小苏苏知识库',
        'font-family:Arial; color:#3370ff ; font-size:18px; font-weight:bold;',
        // ``
      );
    }

    loadGitStar();

    setScripts(scripts || []);
    setInitd();
  });

  useMount(() => {
    const errorTrack = (event: ErrorEvent) => {
      window.umami?.track(TrackEventName.windowError, {
        device: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          appName: navigator.appName
        },
        error: event,
        url: location.href
      });
    };
    // add window error track
    window.addEventListener('error', errorTrack);

    return () => {
      window.removeEventListener('error', errorTrack);
    };
  });

  useRequest2(initFetch, {
    refreshDeps: [userInfo?.username],
    manual: false,
    pollingInterval: 300000 // 5 minutes refresh
  });

  useEffect(() => {
    hiId && localStorage.setItem('inviterId', hiId);
    bd_vid && sessionStorage.setItem('bd_vid', bd_vid);
    k && sessionStorage.setItem('fastgpt_sem', JSON.stringify({ keyword: k }));

    const formatSourceDomain = (() => {
      if (sourceDomain) return sourceDomain;
      return document.referrer;
    })();

    if (formatSourceDomain && !sessionStorage.getItem('sourceDomain')) {
      sessionStorage.setItem('sourceDomain', formatSourceDomain);
    }
  }, [bd_vid, hiId, k, sourceDomain]);

  return {
    feConfigs,
    scripts,
    title
  };
};
