import tkinter as tk
from tkinter import ttk, scrolledtext
import asyncio
from crawl4ai import AsyncWebCrawler
from crawl4ai.async_configs import BrowserConfig


class Crawl4aiGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Crawl4ai Web Crawler")
        self.root.geometry("900x700")
        
        self.url_label = ttk.Label(root, text="Enter URL:")
        self.url_label.pack(pady=5)
        
        self.url_entry = ttk.Entry(root, width=80)
        self.url_entry.pack(pady=5, padx=10)
        
        self.crawl_button = ttk.Button(root, text="Crawl", command=self.start_crawl)
        self.crawl_button.pack(pady=5)
        
        self.status_label = ttk.Label(root, text="Ready")
        self.status_label.pack(pady=5)
        
        self.result_label = ttk.Label(root, text="Result (Markdown):")
        self.result_label.pack(pady=5)
        
        self.result_text = scrolledtext.ScrolledText(root, width=100, height=30, wrap=tk.WORD)
        self.result_text.pack(pady=10, padx=10)
        
        self.clear_button = ttk.Button(root, text="Clear", command=self.clear_result)
        self.clear_button.pack(pady=5)
    
    def start_crawl(self):
        url = self.url_entry.get().strip()
        if not url:
            self.status_label.config(text="Please enter a URL")
            return
        
        if not url.startswith(("http://", "https://")):
            url = "https://" + url
            self.url_entry.delete(0, tk.END)
            self.url_entry.insert(0, url)
        
        self.status_label.config(text="Crawling...")
        self.crawl_button.config(state=tk.DISABLED)
        self.result_text.delete(1.0, tk.END)
        
        asyncio.run(self.crawl_url(url))
    
    async def crawl_url(self, url):
        try:
            browser_config = BrowserConfig(
                browser_type="chromium",
                headless=True,
                channel="chromium"
            )
            async with AsyncWebCrawler(config=browser_config) as crawler:
                result = await crawler.arun(url=url)
                
                if result.success:
                    self.result_text.delete(1.0, tk.END)
                    self.result_text.insert(1.0, result.markdown)
                    self.status_label.config(text="Crawling complete!")
                else:
                    self.status_label.config(text=f"Error: {result.error_message}")
        except Exception as e:
            self.status_label.config(text=f"Error: {str(e)}")
        finally:
            self.crawl_button.config(state=tk.NORMAL)
    
    def clear_result(self):
        self.result_text.delete(1.0, tk.END)
        self.url_entry.delete(0, tk.END)
        self.status_label.config(text="Ready")


def main():
    root = tk.Tk()
    app = Crawl4aiGUI(root)
    root.mainloop()


if __name__ == "__main__":
    main()