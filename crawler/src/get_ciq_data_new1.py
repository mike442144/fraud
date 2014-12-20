#!/usr/bin/env python
# coding: utf-8

__author__ = 'hxgqh'

import re
import os
import sys
import time
import xlrd
import xlwt
import json
import datetime
import traceback
import platform
import logging
from selenium import webdriver
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.support.ui import WebDriverWait     # available since 2.4.0
import selenium.webdriver.support.ui as ui

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

logging.basicConfig(level=logging.DEBUG,
                format='%(asctime)s %(filename)s[line:%(lineno)d] %(levelname)s %(message)s',
                datefmt='%a, %d %b %Y %H:%M:%S',
                filename=os.path.join(BASE_DIR, 'data', 'ciq' + str(datetime.datetime.now().strftime('%Y-%m-%d-%H-%M')) + '.log'),
                filemode='w')

logging.info('BASE_DIR: ' + BASE_DIR)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "companyanalysis.settings")

login_url = 'https://www.capitaliq.com/home.aspx'
url = 'http://www.capitaliq.com'
create_watch_list_url = 'https://www.capitaliq.com/CIQDotNet/CoverageMgt/MyWatchLists.aspx?create=true'
screen_people_url = 'https://www.capitaliq.com/CIQDotNet/Screening/ScreenBuilderViper.aspx?screentypeid=2&clear=all'
screen_company_url = 'https://www.capitaliq.com/CIQDotNet/Screening/ScreenBuilderViper.aspx?screentypeid=1&clear=all'
search_company_url = 'https://www.capitaliq.com/CIQDotNet/company.aspx'
company_detail_base_url = 'https://www.capitaliq.com/CIQDotNet/company.aspx?companyId='
person_detail_base_url = 'https://www.capitaliq.com/CIQDotNet/Person/PersonProfile.aspx?personId='

download_person_info_excel_url = 'https://www.capitaliq.com/CIQDotNet/Reporting/Monitor/Monitor.aspx'
#browser_download_dir = 'C:\Users\ltao\Downloads'
browser_download_dir = 'C:\Users\LT\Downloads'
already_downloaded = True

MAX_SEED_NUM = 300

username = 'ken.wang@bda.com'
password = 'Fraud@2014'

state_index = {'start': 0, 'create_watch_list': 1, 'download_person_excel': 2, 'store_person_excel_info': 3, 'download_company_excel':4, 'store_company_excel_info':5, 'end': 6}



class CIQ(object):
    """
    获取www.capticaliq.com的数据
    """
    re_stock_in_name = re.compile(r'\(([A-Za-z]+:[\dA-Za-z]+)\)')
    re_blank = re.compile(r'\s')
    re_status_in_name = re.compile(r'\(([A-Z\da-z,\s]+)\)')

    def __init__(self, driver_flag=True, **kwargs):
        self.wait = None
        if driver_flag:
            self.browser = webdriver.Chrome(os.path.join(BASE_DIR, 'scraper/driver/chromedriver.exe'))   # 打开浏览器
            # self.browser = webdriver.Chrome(os.path.join(BASE_DIR, 'scraper/driver/chromedriver.mac'))   # 打开浏览器
            # self.browser = webdriver.PhantomJS('/opt/company-analysis/scraper/driver/phantomjs')   # 打开浏览器
            # self.browser = webdriver.PhantomJS(os.path.join(BASE_DIR, 'scraper/driver/phantomjs.mac'))   # 打开浏览器
            # self.browser = webdriver.Firefox()   # 打开浏览器
            self.browser.maximize_window()
            self.wait = ui.WebDriverWait(self.browser, 60)    # 设定最长等待加载时间为30秒
            self.main_window = None
        #self.seed_file = kwargs.get('seed_file', os.path.join(BASE_DIR, 'fakedata/seeds/test_seed.txt'))
        self.seed_name  = os.path.join(BASE_DIR, 'fakedata/seeds/test_seed')
        self.related_seed_name = os.path.join(BASE_DIR, 'data', 'related_seed')
        self.related_seed_part_num = 0
        self.seed_watch_list_name = 'seed_watch_list'#+ str(datetime.datetime.now().strftime('%Y-%m-%d-%H-%M'))
        self.related_watch_list_name = 'related_seed_watch_list'
        self.seed_id = kwargs.get('seed_id', 1)
        self.stage = {}
        self.company_id_arr = []
        self.seed_companies = {}
        # with open(self.seed_file, 'r') as fp:
        #     for l in fp.readlines():
        #         if not l:
        #             continue
        #         if 'IQ' in l:
        #             self.seed_companies['company_id'] = (l.replace('IQ', '').replace('\r', '').replace('\n', ''))
        #             pass
        #         pass

        self.re_company_person_num = re.compile(r'Viewing\s+\d+-\d+\s+of\s+(\d+)')
        self.re_company_id = re.compile(r'companyId=(\d+)')
        self.re_stock_in_name = re.compile(r'\(([A-Z]+:[\dA-Za-z]+)\)')
        self.re_status_in_name = re.compile(r'\(([A-Z\da-z]+)\)')

        self.seed_company_person_info = {}
        self.seed_company_detail = {}
        self.related_company_person_info = {}
        self.related_company_detail = {}

        #清空上一次的临时数据
        sysstr = platform.system()
        if(sysstr =="Windows"):
        #    os.system('del /f ' + os.path.join(BASE_DIR, 'data', '*.xls'))
            pass
        elif(sysstr == "Linux"):
            os.system('rm -f ' + os.path.join(BASE_DIR, 'data', '*.xls'))
        else:
            logging.info("Unknown System tasks")
        pass

    def login(self):
        """
        填写账号密码登陆
        """
        self.browser.get(url)
        self._keep_wait(lambda browser: browser.find_element_by_xpath("//table[@id='Table1']"))
        # self._keep_wait(lambda browser: browser.find_element_by_xpath("//iframe[@id='loginarea']"))
        el = self.browser.find_element_by_xpath("//table[@id='Table1']")
        # el = self.browser.find_element_by_xpath("//iframe[@id='loginarea']")
        self.main_window = self.browser.current_window_handle

        # try_num = 5
        # while try_num:
        #     try:
        #         self.browser.switch_to.frame(el)
        #         try_num = 0
        #         pass
        #     except Exception as e:
        #         logging.info('try login')
        #         time.sleep(5)
        #         self.browser.get(url)
        #         self._keep_wait(lambda browser: browser.find_element_by_xpath("//table[@id='Table1']"))
        #         # self._keep_wait(lambda browser: browser.find_element_by_xpath("//iframe[@id='loginarea']"))
        #        el = self.browser.find_element_by_xpath("//table[@id='Table1']")
        #         # el = self.browser.find_element_by_xpath("//iframe[@id='loginarea']")
        #         try_num -= 1

        # 直到出现左上角登录输入用户名的框
        self._keep_wait(lambda browser: browser.find_element_by_xpath("//input[@id='myLogin_myUsername']"))
        # user = self.browser.find_element_by_id("myLogin_myUsername")
        user = self.browser.find_element_by_xpath("//input[@id='myLogin_myUsername']")
        user.clear()
        user.send_keys(username)    # 输入用户名

        # self.wait.until(lambda browser: browser.find_element_by_xpath("//input[@id='myLogin_myPassword']"))
        passwd = self.browser.find_element_by_xpath("//input[@id='myLogin_myPassword']")
        passwd.clear()
        passwd.send_keys(password)    # 输入密码

        # 点击登录
        # self.wait.until(lambda browser: browser.find_element_by_xpath("//input[@id='myLogin_myLoginButton']"))
        self._safe_click("//input[@id='myLogin_myLoginButton']", False)

        logging.info(self.browser.current_url)
        if 'CIQDotNet/my/dashboard.aspx' in self.browser.current_url:
            logging.info('Login success')
            self._forbid_alert()
            return True
            pass
        logging.info('Login fail')
        return False
        pass
    
    def _check_close_alert(self):
        try:
            alert = self.browser.switch_to_alert()
            alert.dismiss()
            print 'close alert'
            self.browser.switch_to_window(self.main_window)
            return True
        except Exception as e:
            return False
            

    def _forbid_alert(self):
        self.browser.execute_script("window.onbeforeunload = function(e){};" );

    def _refresh(self):
        self.browser.get(self.browser.current_url);
        time.sleep(5)

    def _safe_click(self, which, is_by_id):
        try_num = 3
        while try_num:
            try:
                if is_by_id:
                    self.browser.find_element_by_id(which).click()
                else:
                    self.browser.find_element_by_xpath(which).click()
                return True
            except Exception as e:
                logging.warning(e)
                logging.debug(traceback.format_exc())
                print 'again try click'
                try_num -= 1
                self._check_close_alert()
                time.sleep(3)

        self._refresh()
        self._safe_click(which, is_by_id)
        return False

    def _keep_wait(self, exp):
        try_num = 3
        while try_num:
            try:
                self._check_close_alert()
                self.wait.until(exp)
                break
                pass
            except Exception as e:
                logging.warning(e)
                logging.debug(traceback.format_exc())
                print 'keep wait'
                try_num -= 1
                self._check_close_alert()
                time.sleep(3)
        if try_num == 0:
            raise TimeoutException('wait die..')

    def _check_init_stage_file(self):
        if not os.path.exists(os.path.join(BASE_DIR, 'data', 'stage.json')):
            self.stage = {'login': {'state':0}, 'seed': 0, 'related': 0}
            self._save_stage()
        else:
            with open(os.path.join(BASE_DIR, 'data', 'stage.json'), 'r') as fp:
                self.stage = json.load(fp)

    def _clear_stage_file(self):
        if not os.path.exists(os.path.join(BASE_DIR, 'data', 'stage.json')):
            pass
        else:
            with open(os.path.join(BASE_DIR, 'data', 'stage.json'), 'r') as fp:
                self.stage = json.load(fp)
            self.stage['login']['state'] = 0
            self._save_stage()

    def _save_stage(self):
        with open(os.path.join(BASE_DIR, 'data', 'stage.json'), 'w+') as fp:
            json.dump(self.stage, fp, indent=4)
        pass

    def _upload_one_seed(self, seed_file, is_related=False):
        """
        上传一个seed
        """
        ### 上传种子文件
        # 选择上传文件的方式
        self._keep_wait(lambda browser: browser.find_element_by_xpath("//label[@for='_watchLists__displaySection_uploader']"))
        self._safe_click("//label[@for='_watchLists__displaySection_uploader']", False)

        # 选择种子文件的类型
        seed_type = 'IQ ID'
        if is_related:
            seed_type = 'Ticker'
        self._keep_wait(lambda browser: browser.find_element_by_id('_watchLists__displaySection__identifierListId'))
        el = self.browser.find_element_by_id('_watchLists__displaySection__identifierListId')
        for option in el.find_elements_by_tag_name('option'):
            if option.text == seed_type:
                option.click()
                pass
            pass

        print 'Specify watch list seed file'
        # 设置上传的文件
        self._keep_wait(lambda browser: browser.find_element_by_id('_watchLists__displaySection__browseButtonId'))
        input_upload_file = self.browser.find_element_by_id('_watchLists__displaySection__browseButtonId')
        input_upload_file.send_keys(seed_file)

        print 'Click upload watch list seed file'
        # 点击上传文件
        self._keep_wait(lambda browser: browser.find_element_by_id('_watchLists__displaySection__uploadButtonId'))
        self._safe_click('_watchLists__displaySection__uploadButtonId', True)
        time.sleep(3)

    def _create_watch_list(self, watch_list_name, seed_file):
        """
        上传目标公司ID列表（txt）到CIQ的My List
        """
        self.browser.get(create_watch_list_url)
        time.sleep(3)

        print 'Start to create watch list'
        ### 输入watch list的名称
        self._keep_wait(lambda browser: browser.find_element_by_id('_watchLists_ctl01_float_createWatchList__newWatchListTextBox').is_displayed())     # 找到创建watch list的框
        self.browser.find_element_by_id('_watchLists_ctl01_float_createWatchList__newWatchListTextBox').send_keys(watch_list_name)

        print 'click create watch list'
        ### 点击创建watch list
        self._safe_click('_watchLists_ctl01_float_createWatchList__newWatchListButton', True)

        time.sleep(3)
    
        self._upload_one_seed(seed_file)

        print 'Click save watch list'
        # 保存
        self._keep_wait(lambda browser: browser.find_element_by_id('_watchLists__saveChanges'))
        self._safe_click('_watchLists__saveChanges', True)
        time.sleep(3)

        print "watch list created"
        pass

    def _go_to_company_excel_download_page(self):
        print "start to open company excel download page"
        self.browser.get(screen_company_url)
        time.sleep(5)

    def _go_to_person_excel_download_page(self):
        print "start to open person excel download page"
        self.browser.get(screen_people_url)
        time.sleep(5)

    def _select_watch_list(self, watch_list_name):
        print 'Start to select Watch List'
        try_watch_list_num = 3
        while try_watch_list_num:
            try:
                self._keep_wait(lambda browser: browser.find_element_by_link_text('Watch Lists'))
                self.browser.find_element_by_link_text('Watch Lists').click()
                break
                pass
            except Exception as e:
                logging.warning(e)
                logging.debug(traceback.format_exc())
                print 'try watch list'
                self.browser.get(screen_people_url)
                time.sleep(10)
                try_watch_list_num -= 1
        #self.browser.find_element_by_link_text('Watch Lists').click()    # 点击Watch Lists

        main_body = self.browser.current_window_handle
        self._keep_wait(lambda browser: browser.find_element_by_id('addCriteriaFrame'))
        self.browser.switch_to.frame(self.browser.find_element_by_id('addCriteriaFrame'))

        #self._keep_wait(lambda browser: browser.find_element_by_id('_CDivS_ctl08_CD_SearchText'))
        #self._safe_click('_CDivS_ctl08_CD_SearchText', True)
        #self.browser.find_element_by_id('_CDivS_ctl08_CD_SearchText').clear()
        #self.browser.find_element_by_id('_CDivS_ctl08_CD_SearchText').send_keys(watch_list_name)
        #self._safe_click('_CDivS_ctl08_CD__marketViewSearch', True)    # search

        self._keep_wait(lambda browser: browser.find_element_by_id('_CDivS_ctl08_CD_MarketViews_optionsList'))
        el = self.browser.find_element_by_id('_CDivS_ctl08_CD_MarketViews_optionsList')
        option_clicked = False
        for option in el.find_elements_by_tag_name('option'):
            if option.text == watch_list_name:
                option.click()
                option_clicked = True
                break
                pass
            pass

        if not option_clicked:
            try:
                self._safe_click('_CDivS_ctl08_CD_Tablecell3', True)
                time.sleep(1)
                el = self.browser.find_element_by_id('_CDivS_ctl08_CD_MarketViews_optionsList')
                for option in el.find_elements_by_tag_name('option'):
                    if option.text == watch_list_name:
                        option.click()
                        option_clicked = True
                        pass
                    pass
                pass
            except Exception as e:
                logging.warning(e)
                logging.debug(traceback.format_exc())
            pass

        if not option_clicked:
            print 'watch list not select'
            return {}
        self._safe_click('_CDivS_ctl08_CD_MarketViews_addBtn', True)

        self._keep_wait(lambda browser: browser.find_element_by_id('DisplaySection1__addCriterion__addCriterionSubmitButton'))
        self._safe_click('DisplaySection1__addCriterion__addCriterionSubmitButton', True)  # add criteria
        time.sleep(3)

        self.browser.switch_to.window(main_body)
        pass

    def _select_column_template(self, template='Auto Template'):
        print 'Start to select template'
        self._keep_wait(lambda browser: browser.find_element_by_id('viewCriteriaTemplateDropdown'))
        el = self.browser.find_element_by_id('viewCriteriaTemplateDropdown')
        el.click()
        time.sleep(6)
        for option in el.find_elements_by_tag_name('option'):
            if option.text == template:
                option.click()  # select() in earlier versions of webdriver    
                break
        time.sleep(5)

        self._safe_click('viewCriteriaTemplateGoButton', True)
        print 'Template selected'
        time.sleep(5)

        self._keep_wait(lambda browser: browser.find_element_by_id('viewTopControl_resultsLink'))
        self._safe_click('viewTopControl_resultsLink', True)

    def _close_other_window(self):
        now_handle = self.browser.current_window_handle #得到当前窗口句柄
        all_handles = self.browser.window_handles #获取所有窗口句柄

        for handle in all_handles:
            if handle != now_handle:
                self.browser.switch_to_window(handle)
                self.browser.close()
        self.browser.switch_to_window(now_handle) #返回window.html

    def _switch_to_another_window(self):
        now_handle = self.browser.current_window_handle #得到当前窗口句柄
        all_handles = self.browser.window_handles #获取所有窗口句柄
        for handle in all_handles:
            if handle != now_handle:
                self.browser.switch_to_window(handle)
                return True
        return False

    def _download_company_person_info_excel(self, part_idx, is_related, is_person=True):
        print 'Start to download company person info excel'
        target_file_name = 'PersonScreeningReport.xls'
        if not is_person:
            target_file_name = 'CompanyScreeningReport.xls'
        if self._switch_to_another_window():
            target_file_name = 'Person Screening Report.xls'
            if not is_person:
                target_file_name = 'Company Screening Report.xls'
            try_download_num = 5
            dict_person_info = {}
        
            while try_download_num:
                time.sleep(10)
        
                try_wait_link_num = 5
                while try_wait_link_num:
                    try:
                        self._keep_wait(lambda browser: browser.find_element_by_xpath('//table[@id="generating-reports-list"]/tbody/tr[1]'))
                        break
                        pass
                    except Exception as e:
                        print 'again wait download link'
                        try_wait_link_num -= 1
                        pass
                    pass
                #if not try_download_num:
                #    print "Cann't download excel"
                #    return -1
                print 'download link found'

                data_status = self.browser.find_element_by_xpath('//table[@id="generating-reports-list"]/tbody/tr[1]').get_attribute('data-status')
                max_wait_time = 200
                while data_status != u'2' and max_wait_time:
                    data_status = self.browser.find_element_by_xpath('//table[@id="generating-reports-list"]/tbody/tr[1]').get_attribute('data-status')
                    print 'wait until download link enable:' + str(max_wait_time)
                    if data_status == u'0':
                        print 'generate report failed'
                        break
                    time.sleep(2)
                    max_wait_time -= 2

                if data_status == u'2':
                    self.browser.find_element_by_xpath('//table[@id="generating-reports-list"]/tbody/tr[1]').find_element_by_link_text('Download').click()
                    break
                elif data_status == u'0':
                    self._switch_to_another_window()
                    self._close_other_window()
                    self._safe_click('_displayOptions_Displaysection1_ReportingOptions_GoButton', True)
                    print 'again click download excel go button'
                    try_download_num -= 1
                else:
                    try_download_num -= 1
        
        wait_download_cnt = 1
        print 'downloading excel file'
        time.sleep(300)
        while not os.path.isfile(os.path.join(browser_download_dir, target_file_name)):
            print 'downloading excel file ' + str(wait_download_cnt)
            wait_download_cnt += 1
            time.sleep(100)
        pass

        print 'Start to move download excel to working dir[../data]'
        filename = 'seed_psr' + str(part_idx) + '.xls'
        if not is_person:
            filename = 'seed_csr' + str(part_idx) + '.xls'
        if is_related:
            filename = 'related_psr' + str(part_idx) + '.xls'
            if not is_person:
                filename = 'related_csr' + str(part_idx) + '.xls'
        
        sysstr = platform.system()
        if(sysstr =="Windows"):
            cmd = 'move "' + os.path.join(browser_download_dir, target_file_name) + '" ' + os.path.join(BASE_DIR, 'data', filename)
            os.system(cmd)
        elif(sysstr == "Linux"):
            os.system('mv ' + os.path.join(browser_download_dir, target_file_name) + ' ' + os.path.join(BASE_DIR, 'data', filename))
        else:
            print ("Unknown System tasks")
        pass
        self._switch_to_another_window()
        self._close_other_window()

    def parse_person_info(self, part_idx, is_related):
        """
        解析下载Excel中的公司管理层信息
        @return: 一个如下的字典：
        {
            person_id: {
                'person_id': 123566,
                'person_name': 'Lingqi Liu',
                'company_id': 123456,
                'company_name': 'BDA',
                'exchange_ticker': 'SEHK:724',
                'professional_titles': '',
                'background': '',
                'all_company_affiliations': '',
                'email_address': 'hxgqh@126.com',
                #'colleges_universities': '',
                #'majors': '',
                'person_age': 52,
                'year_born': 1962,
                'board_membership': '',
                'status': '',
                'years_on_board': '2008-2012'
            },
            ...
        }
        """
        dict_person_info = {}
        related_tickers = set([])
        filename = 'seed_psr' + str(part_idx) + '.xls'
        if is_related:
            filename = 'related_psr' + str(part_idx) + '.xls'
    
        excel_file_name = os.path.join(BASE_DIR,"data",filename) 
            
        with open(excel_file_name, 'r') as fp:
            data = xlrd.open_workbook(excel_file_name)
            sheet = data.sheet_by_index(0)
            rows = sheet.nrows
            for row in range(rows-8):
                value = sheet.row_values(row + 8)
                person_id = value[15].replace('IQ', '')
                company_id = value[16].replace('IQ', '')
                try:
                    dict_person_info[person_id] = {
                        'person_id': person_id,
                        'person_name': value[0],
                        'company_id': company_id,
                        'company_name': value[1],
                        'exchange_ticker': value[2],
                        'professional_titles': value[4],
                        'background': value[6],
                        'all_company_affiliations': value[12],
                        'email_address': value[3],
                        'colleges_universities': value[8],
                        'majors': value[9],
                        'person_age': value[10],
                        'year_born': value[11],
                        'board_membership': value[13],
                        'status': '', #if not CIQ.re_status_in_name.findall(value[0]) else CIQ.re_stock_in_name.findall(value[0])[0],
                        'years_on_board': ''
                    }

                    # 解出关联公司的股票代码
                    for related_company_ticker in dict_person_info[person_id].get('all_company_affiliations').split(';'):
                        if self.re_stock_in_name.findall(related_company_ticker):
                            ticker_in_name = self.re_stock_in_name.findall(related_company_ticker)[0]
                            related_tickers.add(ticker_in_name)
 
                except Exception as e:
                    logging.warning(e)
                    logging.debug(traceback.format_exc())
                    pass
            pass

        # 把excel信息存成json
        json_name = 'seed_psr' + str(part_idx) + '.json'
        if is_related:
            json_name = 'related_psr' + str(part_idx) + '.json'

        with open(os.path.join(BASE_DIR, 'data', json_name), 'w+') as fp:
                json.dump(dict_person_info, fp, indent=4)
        print 'company info dump to json finished'

        if is_related:
            return

        # 把解出的相关公司股票代码分多个文件存成种子
        ticker_list = list(related_tickers)
        ticker_list.sort()

        ticker_len = len(ticker_list)
        ticker_idx = 0
        related_seed_path = os.path.join(BASE_DIR, 'data', self.related_seed_name)
        while ticker_idx < ticker_len - 1:
            try:
                seed_file_name = related_seed_path + str(part_idx) + '-' + str(self.related_seed_part_num + 1) + '.txt'
                with open(seed_file_name, 'w+') as fp:
                    file_ticker_len = 0
                    while True:
                        related_company_ticker = ticker_list[ticker_idx]
                        fp.write(related_company_ticker + '\r\n')
                        ticker_idx += 1
                        file_ticker_len += 1
                        if file_ticker_len == MAX_SEED_NUM or ticker_idx == ticker_len:
                            self.related_seed_part_num += 1
                            break
                    pass
            except Exception as e:
                logging.warning(e)
                logging.debug(traceback.format_exc())
                pass
            pass
        pass     

    def parse_company_info(self, part_idx, is_related):
        """
        解析下载Excel中的公司信息
        @return: 一个如下的字典：
        {
            company_id: {
                'company_name': 'BDA',
                'exchange_ticker': 'SEHK:724',
                'watch_list':'',
                'bussiness_descriptioh':'',
                'market capitalization':'',
                'key executives': '',
                'board members': ''
            },
            ...
        }
        """
        dict_company_info = {}
        company_id_arr = []
        filename = 'seed_csr' + str(part_idx) + '.xls'
        if is_related:
            filename = 'related_csr' + str(part_idx) + '.xls'
    
        excel_file_name = os.path.join(BASE_DIR,"data",filename) 
            
        with open(excel_file_name, 'r') as fp:
            data = xlrd.open_workbook(excel_file_name)
            sheet = data.sheet_by_index(0)
            rows = sheet.nrows
            for row in range(rows-8):
                value = sheet.row_values(row + 8)
                company_id = value[21].replace('IQ', '')
                company_id_arr.append(company_id)
                try:
                    dict_company_info[company_id] = {
                        'company_name': value[0],
                        'exchange_ticker': value[1],
                        'watch_list': value[2],
                        'bussiness_descriptioh': value[9],
                        'market capitalization':value[11],
                        'key executives': value[18],
                        'board members': value[19],
                    }
                except Exception as e:
                    logging.warning(e)
                    logging.debug(traceback.format_exc())
                    pass
            pass

        # 把excel信息存成json
        json_name = 'seed_csr' + str(part_idx) + '.json'
        if is_related:
            json_name = 'related_csr' + str(part_idx) + '.json'

        with open(os.path.join(BASE_DIR, 'data', json_name), 'w+') as fp:
                json.dump(dict_company_info, fp, indent=4)
        print 'company info dump to json finished'

        company_id_arr_file = 'seed_company_arr.json'
        if is_related:
            company_id_arr_file = 'seed_company_arr.json'

        with open(os.path.join(BASE_DIR, 'data', company_id_arr_file), 'w+') as fp1:
            company_arr_json = []
            try:
                company_arr_json = json.load(fp1)
            except Exception as e:
                company_arr_json = []
                
            company_arr_json = company_arr_json + company_id_arr
            json.dump(company_arr_json, fp1, indent=4)
        pass

    def get_one_company_detail(self, company):
        """
        获取一个公司的相信信息
        """
        print 'get company %s detail' % str(company)
       

        self.browser.get('https://www.capitaliq.com/CIQDotNet/company.aspx?companyId=' + company)
        time.sleep(1)
        self._keep_wait(lambda browser: browser.find_element_by_id('frmMain'))

        dict_one_company_detail = {}
        # get auditor info here
        try:
            try_auditor_num = 2
            while try_auditor_num:
                try:
                    # self.wait.until(lambda browser: browser.find_element_by_id('ll_7_92_2245_my'))
                    self._safe_click('ll_7_92_2245_my', True)
                    self._keep_wait(lambda browser: browser.find_element_by_id('_dataGrid'))
                    time.sleep(1)
                    break
                    pass
                except Exception as e:
                    print e
                    try_auditor_num -= 1
                    print 'try auditor'
                    time.sleep(0.2)
                    pass

            dict_one_company_detail['auditor'] = {}
            for tr in self.browser.find_element_by_id("_dataGrid").find_elements_by_tag_name('tr')[2:]:
                tds = tr.find_elements_by_tag_name('td')
                try:
                    company_id = self.re_company_id.findall(tds[1].find_element_by_tag_name('a').get_attribute('href'))[0]
                    company_name = tds[1].text
                    dict_one_company_detail['auditor'][company_id] = {
                        'company_id': company_id,
                        'company_name': company_name
                    }
                    pass
                except Exception as e:
                    print e
                    print traceback.format_exc()
                    print 'error'
                pass
            pass
        except Exception as e:
            print 'error: can not get auditor info of ', company

        # get advisor info here
        try:
            try_advisor_num = 2
            while try_advisor_num:
                try:
                    # self.wait.until(lambda browser: browser.find_element_by_id('ll_7_17_2246'))
                    self._safe_click('ll_7_17_2246', True)
                    self._keep_wait(lambda browser: browser.find_element_by_id('_AggregatedGridView'))
                    time.sleep(1)
                    break
                    pass
                except Exception as e:
                    try_advisor_num -= 1
                    print 'try advisor'
                    time.sleep(0.2)
                    pass

            dict_one_company_detail['advisor'] = {}
            for tr in self.browser.find_element_by_id("_AggregatedGridView").find_elements_by_tag_name('tr')[2:]:
                tds = tr.find_elements_by_tag_name('td')
                try:
                    company_id = self.re_company_id.findall(tds[1].find_element_by_tag_name('a').get_attribute('href'))[0]
                    company_name = tds[1].text
                    specialty = tds[2].text.lower().replace(' ','')
                    dict_one_company_detail['advisor'][company_id] = {
                        'company_id': company_id,
                        'company_name': company_name,
                        'specialty': specialty
                    }
                    pass
                except Exception as e:
                    print e
                    print traceback.format_exc()
                    print 'error'
                pass
            pass
        except Exception as e:
            print 'error: can not get advisor info of ', company


        with open(os.path.join(BASE_DIR, 'data', 'detail', company + '.json'), 'w+') as fp:
                json.dump(dict_one_company_detail, fp, indent=4)
        pass

    def _stage_login(self):

        if self.stage['login']['state'] < state_index['end']:
            self.login()
            self.stage['login']['state'] += 6
            if self.stage['seed'] == 0:
               self.stage['seed'] = {'parts': 1, 'part': 1, 'state': 0}
            self._save_stage()
            print 'stage login finished'

    def _stage_seed(self):
        """
        获取目标公司列表的管理层及其关联公司的信息
        """

        # 创建所有所需的watch list
        if self.stage['seed']['state'] < state_index['create_watch_list']:
            while self.stage['seed']['part'] <= self.stage['seed']['parts']:
                # 上传种子公司ID列表（txt）到CIQ的My List
                part_idx = self.stage['seed']['part']
                self._create_watch_list(self.seed_watch_list_name + str(part_idx), self.seed_name + str(part_idx) + '.txt')
                self.stage['seed']['part'] += 1
                self._save_stage()

            self.stage['seed']['state'] += 1
            self.stage['seed']['part'] = 1
            self._save_stage()

        # 下载所有所需的person excel
        if self.stage['seed']['state'] < state_index['download_person_excel']:
            while self.stage['seed']['part'] <= self.stage['seed']['parts']:
                part_idx = self.stage['seed']['part']
                # 在Screen People下选择Criteria为My List，勾选创建的种子公司列表
                self._go_to_person_excel_download_page()
                self._select_watch_list(self.seed_watch_list_name + str(part_idx))
                # 选择Customize Display Columns
                self._safe_click("//div[@id='viewCriteriaControl_tabControl_displayCriteriaMenuItem_DisplayCriteriaMenuItem']/div[@class='tabDiv']", False)
                # 选择Templates
                self._select_column_template()
                # 点击下载按钮
                self._keep_wait(lambda browser: browser.find_element_by_id('_displayOptions_Displaysection1_ReportingOptions_GoButton'))
                self._safe_click('_displayOptions_Displaysection1_ReportingOptions_GoButton', True)
                while self._check_close_alert():
                    self._safe_click('_displayOptions_Displaysection1_ReportingOptions_GoButton', True)
                print 'just click download excel go button'
                time.sleep(5)
                self._download_company_person_info_excel(part_idx, False)                

                self.stage['seed']['part'] += 1
                self._save_stage()
            
            self.stage['seed']['state'] += 1
            self.stage['seed']['part'] = 1
            self._save_stage()
        
        # 解析所有所需的excel
        if self.stage['seed']['state'] < state_index['store_person_excel_info']:
            while self.stage['seed']['part'] <= self.stage['seed']['parts']:    
                part_idx = self.stage['seed']['part']
                dict_person_info = self.parse_person_info(part_idx, False)
                self.stage['seed']['part'] += 1
                self._save_stage()
            
            self.stage['seed']['state'] += 1
            self.stage['seed']['part'] = 1
            self._save_stage()
        
        # 下载所有所需的company excel
        if self.stage['seed']['state'] < state_index['download_company_excel']:
            while self.stage['seed']['part'] <= self.stage['seed']['parts']:
                part_idx = self.stage['seed']['part']
                # 在Screen Company下选择Criteria为My List，勾选创建的种子公司列表
                self._go_to_company_excel_download_page()
                self._select_watch_list(self.seed_watch_list_name + str(part_idx))
                # 选择Customize Display Columns
                self._safe_click("//div[@id='viewCriteriaControl_tabControl_displayCriteriaMenuItem_DisplayCriteriaMenuItem']/div[@class='tabDiv']", False)
                # 选择Templates
                self._select_column_template('Detailed Company Fields')
                # 点击下载按钮
                self._keep_wait(lambda browser: browser.find_element_by_id('_displayOptions_Displaysection1_ReportingOptions_GoButton'))
                self._safe_click('_displayOptions_Displaysection1_ReportingOptions_GoButton', True)
                while self._check_close_alert():
                    self._safe_click('_displayOptions_Displaysection1_ReportingOptions_GoButton', True)
                print 'just click download excel go button'
                time.sleep(5)
                self._download_company_person_info_excel(part_idx, False, False)                

                self.stage['seed']['part'] += 1
                self._save_stage()
            
            self.stage['seed']['state'] += 1
            self.stage['seed']['part'] = 1
            self._save_stage()

        # 解析所有所需的company excel
        if self.stage['seed']['state'] < state_index['store_company_excel_info']:
            while self.stage['seed']['part'] <= self.stage['seed']['parts']:    
                part_idx = self.stage['seed']['part']
                dict_person_info = self.parse_company_info(part_idx, False)
                self.stage['seed']['part'] += 1
                self._save_stage()
            
            self.stage['seed']['state'] += 1
            self.stage['seed']['part'] = 1
            self._save_stage()

        # 完成
        if self.stage['seed']['state'] < state_index['end']:
            # 设置状态为 stage_seed done
            self.stage['seed']['state'] += 1
            print 'seed stage finished'
            # 初始化 stage_related
            self.stage['related'] = {'parts': self.related_seed_part_num, 'part': 1, 'state': 0}
            self._save_stage()
        
    def _stage_related(self):
        """
        获取关联公司列表的管理层及其关联公司的信息
        """

        # 创建所有所需的watch list
        if self.stage['related']['state'] < state_index['create_watch_list']:
            while self.stage['related']['part'] <= self.stage['seed']['parts']:
                # 上传种子公司ID列表（txt）到CIQ的My List
                part_idx = self.stage['related']['part']
                self._create_watch_list(self.related_watch_list_name + str(part_idx), self.related_seed_name +  '1-' + str(part_idx) + '.txt')
                self.stage['related']['part'] += 1
                self._save_stage()

            self.stage['related']['state'] += 1
            self.stage['related']['part'] = 1
            self._save_stage()

        # 下载所有所需的excel
        if self.stage['related']['state'] < state_index['download_person_excel']:
            while self.stage['related']['part'] <= self.stage['related']['parts']:
                part_idx = self.stage['related']['part']
                # 在Screen People下选择Criteria为My List，勾选创建的种子公司列表
                self._go_to_person_excel_download_page()
                self._select_watch_list(self.related_watch_list_name + str(part_idx))
                # 选择Customize Display Columns
                self._safe_click("//div[@id='viewCriteriaControl_tabControl_displayCriteriaMenuItem_DisplayCriteriaMenuItem']/div[@class='tabDiv']", False)
                # 选择Templates
                self._select_column_template()
                # 点击下载按钮
                self._keep_wait(lambda browser: browser.find_element_by_id('_displayOptions_Displaysection1_ReportingOptions_GoButton'))
                self._safe_click('_displayOptions_Displaysection1_ReportingOptions_GoButton', True)
                if self._is_alert_present():
                    self._close_alert()
                    self._safe_click('_displayOptions_Displaysection1_ReportingOptions_GoButton', True)
                print 'just click download excel go button'
                time.sleep(5)
                self._download_company_person_info_excel(part_idx, True)
                
                self.stage['related']['part'] += 1
                self._save_stage()
            
            self.stage['related']['state'] += 1
            self.stage['related']['part'] = 1
            self._save_stage()
        
        # 解析所有所需的excel
        if self.stage['related']['state'] < state_index['store_person_excel_info']:
            while self.stage['related']['part'] <= self.stage['related']['parts']:    
                part_idx = self.stage['related']['part']
                dict_person_info = self.parse_person_info(part_idx, True)
                self.stage['related']['part'] += 1
                self._save_stage()
            
            self.stage['related']['state'] += 1
            self.stage['related']['part'] = 1
            self._save_stage()
        
        # 下载所有所需的company excel
        if self.stage['related']['state'] < state_index['download_company_excel']:
            while self.stage['related']['part'] <= self.stage['related']['parts']:
                part_idx = self.stage['related']['part']
                # 在Screen Company下选择Criteria为My List，勾选创建的种子公司列表
                self._go_to_company_excel_download_page()
                self._select_watch_list(self.seed_watch_list_name + str(part_idx))
                # 选择Customize Display Columns
                self._safe_click("//div[@id='viewCriteriaControl_tabControl_displayCriteriaMenuItem_DisplayCriteriaMenuItem']/div[@class='tabDiv']", False)
                # 选择Templates
                self._select_column_template('Detailed Company Fields')
                # 点击下载按钮
                self._keep_wait(lambda browser: browser.find_element_by_id('_displayOptions_Displaysection1_ReportingOptions_GoButton'))
                self._safe_click('_displayOptions_Displaysection1_ReportingOptions_GoButton', True)
                time.sleep(2)
                if self._is_alert_present():
                    self._close_alert()
                    self._safe_click('_displayOptions_Displaysection1_ReportingOptions_GoButton', True)
                print 'just click download excel go button'
                time.sleep(5)
                self._download_company_person_info_excel(part_idx, True, False)                

                self.stage['related']['part'] += 1
                self._save_stage()
            
            self.stage['related']['state'] += 1
            self.stage['related']['part'] = 1
            self._save_stage()

        # 解析所有所需的company excel
        if self.stage['related']['state'] < state_index['store_company_excel_info']:
            while self.stage['related']['part'] <= self.stage['related']['parts']:    
                part_idx = self.stage['related']['part']
                dict_person_info = self.parse_company_info(part_idx, False)
                self.stage['related']['part'] += 1
                self._save_stage()
            
            self.stage['related']['state'] += 1
            self.stage['related']['part'] = 1
            self._save_stage()

        if self.stage['related']['state'] < state_index['end']:
            # 设置状态为 stage_seed done
            self.stage['related']['state'] += 1
            print 'related stage finished'
        
            self.stage['merge'] = {'state': 0}
            self._save_stage()

    def _stage_merge(self):
        if self.stage['merge']['state'] < state_index['end']:
            # do merge here...
            
            print 'merge stage finished'
            self.stage['merge']['state'] += 6      
            
            self.stage['company_detail'] = {'state': 0, 'idx': 0}  
            self._save_stage()

    def _stage_company_detail(self):
        if self.stage['company_detail']['state'] < state_index['end']:
            with open(os.path.join(BASE_DIR, 'data', 'stage.json'), 'r') as fp:
                self.company_id_arr = json.load(fp)
            if not isinstance(self.company_id_arr, list):
                print 'invalid company array...'
            else: 
                start_idx = self.stage['company_detail']['idx']
                arr_len = len(self.company_id_arr)
                while start_idx < arr_len:
                    self.get_one_company_detail(self.company_id_arr[start_idx])
                    start_idx += 1

            print 'company detail stage finished'
            self.stage['merge']['state'] += 6
            self._save_stage()


def run():
    """
    本文件执行的入口
    """
    ciq = CIQ()
    ciq._clear_stage_file()
    while True:
        try:        
            # 加载stage_file
            ciq._check_init_stage_file()

            # 登录
            ciq._stage_login()

            # 目标公司阶段
            ciq._stage_seed()

            # 关联公司阶段
            ciq._stage_related()

            # 合并信息阶段
            ciq._stage_merge()

            # 获取公司详细信息阶段
            ciq._stage_company_detail()

            pass
        except Exception as e:
            logging.warning(e)
            logging.debug(traceback.format_exc())
            try:
                # 如果有弹窗干掉
                self._check_close_alert()
                time.sleep(3)
                pass
            except Exception as e:
                logging.warning(e)
                logging.debug(traceback.format_exc())
            pass
    pass

if __name__ == '__main__':
    print 'start'
    ts = time.time()
    run()
    te = time.time()
    print 'end'
    print 'consume time: %s' % str(te - ts)